import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role client for database operations (needed for settings lookup)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    const cronSecretHeader = req.headers.get('x-cron-secret');
    let userId: string | null = null;
    let isAuthorized = false;

    // Check for cron secret header (for scheduled jobs)
    if (cronSecretHeader) {
      const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'CRON_SECRET')
        .single();
      
      if (setting && setting.value === cronSecretHeader) {
        isAuthorized = true;
        console.log("Cron secret authorization - scheduled job");
      }
    }
    
    // Check if this is a service role call (internal)
    if (!isAuthorized && authHeader && authHeader.includes(supabaseServiceKey)) {
      isAuthorized = true;
      console.log("Service role authorization - internal call");
    }
    
    // Check user authentication and role
    if (!isAuthorized && authHeader) {
      // Extract the JWT token from the Authorization header
      const token = authHeader.replace(/^Bearer\s+/i, "");
      
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Pass the token explicitly to getUser for edge function context
      const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
      
      if (authError) {
        console.log("User auth error:", authError.message);
      }
      
      if (user && !authError) {
        const { data: isAdmin } = await userSupabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        const { data: isEditor } = await userSupabase.rpc('has_role', { _user_id: user.id, _role: 'editor' });

        if (isAdmin || isEditor) {
          isAuthorized = true;
          userId = user.id;
          console.log(`Authenticated user ${user.id} with role: ${isAdmin ? 'admin' : 'editor'}`);
        } else {
          console.log(`User ${user.id} lacks required role (admin or editor)`);
        }
      }
    }

    if (!isAuthorized) {
      console.error("Unauthorized access attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Editor/Admin role, service key, or cron secret required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { categoryIds, categoryNames, count = 2, language = "en", rssOnly = false } = body;

    // Support both single category (legacy) and multiple categories
    const categories = categoryIds || [];
    const names = categoryNames || [];
    
    const mode = rssOnly ? "RSS-only" : "AI";
    console.log(`Auto-generating ${count} article(s) for categories: ${names.join(', ')} in ${language} [${mode} mode]`);

    // First, demote existing breaking news (older than 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { error: demoteError } = await supabase
      .from("articles")
      .update({ is_breaking: false })
      .eq("is_breaking", true)
      .lt("published_at", fifteenMinutesAgo);
    
    if (demoteError) {
      console.error("Error demoting old breaking news:", demoteError);
    } else {
      console.log("Demoted old breaking news");
    }

    // Step 1: Fetch news from RSS feeds - use first category name for news fetching
    const primaryCategory = names[0] || "general";
    const fetchNewsResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ category: primaryCategory, limit: count, focusIndian: true }),
    });

    if (!fetchNewsResponse.ok) {
      throw new Error("Failed to fetch news");
    }

    const { news } = await fetchNewsResponse.json();

    if (!news || news.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No news found for this category" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generatedArticles = [];
    let useRssOnlyFallback = rssOnly;

    for (const newsItem of news) {
      try {
        console.log(`Processing: ${newsItem.title}`);

        let rewritten: { title: string; content: string; excerpt: string; seoKeywords?: string[]; imagePrompt?: string };
        
        if (useRssOnlyFallback) {
          // RSS-only mode: no AI calls, use RSS content directly
          rewritten = createRssOnlyArticle(newsItem, names);
          console.log("Using RSS-only mode (no AI)");
        } else {
          // Try AI rewriting
          const rewriteResponse = await fetch(`${supabaseUrl}/functions/v1/rewrite-article`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              title: newsItem.title,
              description: newsItem.description,
              source: newsItem.source,
              language: language,
              optimizeSEO: true,
            }),
          });

          if (!rewriteResponse.ok) {
            const errorStatus = rewriteResponse.status;
            console.error(`Rewrite failed with status ${errorStatus}`);
            
            // Auto-fallback to RSS-only if credits exhausted or rate limited
            if (errorStatus === 402 || errorStatus === 429) {
              console.log(`AI credits exhausted/rate limited (${errorStatus}). Switching to RSS-only mode for remaining articles.`);
              useRssOnlyFallback = true;
              rewritten = createRssOnlyArticle(newsItem, names);
            } else {
              continue;
            }
          } else {
            rewritten = await rewriteResponse.json();
          }
        }
        
        // Generate SEO-optimized slug
        const slug = rewritten.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 100) + '-' + Date.now();

        // Step 3: Generate image (use varied placeholders for RSS-only mode)
        let imageUrl = getVariedPlaceholderImage(primaryCategory, newsItem.title);
        
        if (!useRssOnlyFallback) {
          const imageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-news-image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              prompt: rewritten.imagePrompt || rewritten.title,
              articleSlug: slug,
            }),
          });
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const rawUrl = imageData.imageUrl;
            
            // Never store base64 images - they break page loads
            if (rawUrl && typeof rawUrl === "string" && !rawUrl.startsWith("data:image")) {
              imageUrl = rawUrl;
              console.log(`Image generated: ${imageData.placeholder ? 'placeholder' : 'AI generated'}`);
            } else if (rawUrl?.startsWith("data:image")) {
              console.log("Received base64 image, using placeholder instead");
            }
          } else if (imageResponse.status === 402 || imageResponse.status === 429) {
            console.log("Image generation credits exhausted, using placeholder");
          }
        } else {
          console.log(`Using varied placeholder image for RSS-only article`);
        }

        // Step 4: Insert into database - ALL new articles are breaking news
        const { data: article, error: insertError } = await supabase
          .from("articles")
          .insert({
            title: rewritten.title,
            slug: slug,
            content: rewritten.content,
            excerpt: rewritten.excerpt,
            featured_image: imageUrl,
            category_id: categories[0], // Primary category
            author_id: userId, // Set the authenticated user as author (null for cron)
            status: "published",
            published_at: new Date().toISOString(),
            is_breaking: true, // All new articles are breaking news
            is_featured: false,
            read_time: Math.ceil(rewritten.content.split(' ').length / 200),
            tags: [...names.filter((n: string) => n), ...(rewritten.seoKeywords || [])],
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          continue;
        }

        console.log(`Article created as BREAKING: ${article.id} [${useRssOnlyFallback ? 'RSS-only' : 'AI'}]`);
        generatedArticles.push(article);

        // Add a small delay between articles to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing news item:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${generatedArticles.length} breaking article(s) [${useRssOnlyFallback ? 'RSS-only' : 'AI'} mode]`,
        articles: generatedArticles,
        mode: useRssOnlyFallback ? 'rss-only' : 'ai'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in auto-generate-news function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Get a varied placeholder image based on category and title hash.
 * Ensures different articles get different images.
 */
function getVariedPlaceholderImage(category: string, title: string): string {
  // Curated Unsplash images for different news categories
  const categoryImages: Record<string, string[]> = {
    politics: [
      "photo-1529107386315-e1a2ed48a620", // Capitol building
      "photo-1555848962-6e79363ec58f", // Government building
      "photo-1541872703-74c5e44368f9", // Voting
      "photo-1568992687947-868a62a9f521", // Parliament
      "photo-1577495508048-b635879837f1", // Flags
    ],
    business: [
      "photo-1460925895917-afdab827c52f", // Business charts
      "photo-1507003211169-0a1dd7228f2d", // Office
      "photo-1454165804606-c3d57bc86b40", // Meeting
      "photo-1611974789855-9c2a0a7236a3", // Stock market
      "photo-1553729459-efe14ef6055d", // Finance
    ],
    technology: [
      "photo-1518770660439-4636190af475", // Circuit board
      "photo-1488590528505-98d2b5aba04b", // Computer
      "photo-1526374965328-7f61d4dc18c5", // Code
      "photo-1550751827-4bd374c3f58b", // Cybersecurity
      "photo-1535378917042-10a22c95931a", // Tech devices
    ],
    sports: [
      "photo-1461896836934- voices-of-the-city-1", // Stadium
      "photo-1579952363873-27f3bade9f55", // Soccer ball
      "photo-1517649763962-0c623066013b", // Athletics
      "photo-1546519638-68e109498ffc", // Basketball
      "photo-1574629810360-7efbbe195018", // Cricket
    ],
    entertainment: [
      "photo-1489599849927-2ee91cede3ba", // Cinema
      "photo-1598899134739-24c46f58b8c0", // Music
      "photo-1514525253161-7a46d19cd819", // Concert
      "photo-1485846234645-a62644f84728", // Film
      "photo-1603190287605-e6ade32fa852", // Theater
    ],
    health: [
      "photo-1505751172876-fa1923c5c528", // Medical
      "photo-1576091160399-112ba8d25d1d", // Doctor
      "photo-1559757175-0eb30cd8c063", // Healthcare
      "photo-1532938911079-1b06ac7ceec7", // Hospital
      "photo-1571019613454-1cb2f99b2d8b", // Fitness
    ],
    world: [
      "photo-1451187580459-43490279c0fa", // Globe
      "photo-1526778548025-fa2f459cd5c1", // World map
      "photo-1521295121783-8a321d551ad2", // International
      "photo-1488085061387-422e29b40080", // Travel
      "photo-1502920917128-1aa500764c93", // Cityscape
    ],
    general: [
      "photo-1504711434969-e33886168f5c", // Newspaper
      "photo-1495020689067-958852a7765e", // News
      "photo-1586339949216-35c2747cc36d", // Headlines
      "photo-1559526324-593bc073d938", // Media
      "photo-1566378246598-5b11a0d486cc", // Reading
    ],
  };

  // Get images for the category (fallback to general)
  const categoryKey = category.toLowerCase();
  const images = categoryImages[categoryKey] || categoryImages.general;
  
  // Create a simple hash from title to get consistent but varied selection
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Select image based on hash
  const index = Math.abs(hash) % images.length;
  const imageId = images[index];
  
  return `https://images.unsplash.com/${imageId}?w=1200&h=630&fit=crop`;
}

/**
 * Create an article from RSS content without AI processing.
 * This is completely free and doesn't consume any AI credits.
 * Cleans up messy RSS content to be readable.
 */
function createRssOnlyArticle(
  newsItem: { title: string; description: string; source: string; link?: string },
  categoryNames: string[]
): { title: string; content: string; excerpt: string; seoKeywords: string[] } {
  const { title, description, source, link } = newsItem;
  
  // Thoroughly clean the description from RSS artifacts
  let cleanDescription = (description || "")
    // Remove CDATA wrapper
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // If description is too short or just truncated, make it clearer
  if (cleanDescription.endsWith('...') || cleanDescription.endsWith('…')) {
    cleanDescription = cleanDescription.slice(0, -3).trim();
    if (cleanDescription.length > 50) {
      cleanDescription += '.';
    }
  }
  
  // Create a clean title (also clean CDATA)
  const cleanTitle = title
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  // Create excerpt (first 200 chars, clean ending)
  let excerpt = cleanDescription.substring(0, 200);
  if (cleanDescription.length > 200) {
    // Cut at last complete word
    const lastSpace = excerpt.lastIndexOf(' ');
    if (lastSpace > 150) {
      excerpt = excerpt.substring(0, lastSpace);
    }
    excerpt += '...';
  }
  
  // Build article content with proper formatting
  const content = `
<p class="lead">${cleanDescription}</p>

<hr />

<p><em>Source: ${source}${link ? ` — <a href="${link}" target="_blank" rel="noopener noreferrer">Read original article</a>` : ''}</em></p>
  `.trim();
  
  // Extract keywords from title (longer words only)
  const keywords = cleanTitle
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4 && !/^(about|their|there|these|those|would|could|should|being|having)$/.test(word))
    .slice(0, 5);
  
  return {
    title: cleanTitle,
    content: content,
    excerpt: excerpt,
    seoKeywords: [...categoryNames, ...keywords].filter(Boolean),
  };
}
