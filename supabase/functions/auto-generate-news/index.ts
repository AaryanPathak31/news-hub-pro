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

    // supabase client already created above

    const { categoryIds, categoryNames, count = 2, language = "en" } = await req.json();

    // Support both single category (legacy) and multiple categories
    const categories = categoryIds || [];
    const names = categoryNames || [];
    
    console.log(`Auto-generating ${count} article(s) for categories: ${names.join(', ')} in ${language}`);

    // First, demote existing breaking news (older than 20 minutes)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const { error: demoteError } = await supabase
      .from("articles")
      .update({ is_breaking: false })
      .eq("is_breaking", true)
      .lt("published_at", twentyMinutesAgo);
    
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

    for (const newsItem of news) {
      try {
        console.log(`Processing: ${newsItem.title}`);

        // Step 2: Rewrite the article using AI with SEO optimization
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
          const error = await rewriteResponse.json();
          console.error("Rewrite failed:", error);
          continue;
        }

        const rewritten = await rewriteResponse.json();
        
        // Generate SEO-optimized slug
        const slug = rewritten.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 100) + '-' + Date.now();

        // Step 3: Generate image
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

        let imageUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop";
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl || imageUrl;
          console.log(`Image generated: ${imageData.placeholder ? 'placeholder' : 'AI generated'}`);
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

        console.log(`Article created as BREAKING: ${article.id}`);
        generatedArticles.push(article);

        // Add a small delay between articles to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing news item:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${generatedArticles.length} breaking article(s)`,
        articles: generatedArticles 
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
