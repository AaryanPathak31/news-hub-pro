import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoryId, categoryName, count = 1 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Auto-generating ${count} article(s) for category: ${categoryName}`);

    // Step 1: Fetch news from RSS feeds
    const fetchNewsResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ category: categoryName, limit: count }),
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

        // Step 2: Rewrite the article using AI
        const rewriteResponse = await fetch(`${supabaseUrl}/functions/v1/rewrite-article`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            title: newsItem.title,
            description: newsItem.description,
            source: newsItem.source,
          }),
        });

        if (!rewriteResponse.ok) {
          const error = await rewriteResponse.json();
          console.error("Rewrite failed:", error);
          continue;
        }

        const rewritten = await rewriteResponse.json();
        
        // Generate slug
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
            "Authorization": `Bearer ${supabaseKey}`,
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
        }

        // Step 4: Insert into database
        const { data: article, error: insertError } = await supabase
          .from("articles")
          .insert({
            title: rewritten.title,
            slug: slug,
            content: rewritten.content,
            excerpt: rewritten.excerpt,
            featured_image: imageUrl,
            category_id: categoryId,
            status: "published",
            published_at: new Date().toISOString(),
            is_breaking: false,
            is_featured: false,
            read_time: Math.ceil(rewritten.content.split(' ').length / 200),
            tags: [categoryName, "AI Generated"],
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          continue;
        }

        console.log(`Article created: ${article.id}`);
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
        message: `Generated ${generatedArticles.length} article(s)`,
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
