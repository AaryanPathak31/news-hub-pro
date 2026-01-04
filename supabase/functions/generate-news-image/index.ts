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
    const { prompt, articleSlug } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating image for: ${articleSlug}`);

    // Use Lovable AI with image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `Generate a professional news article header image: ${prompt}. Style: photojournalistic, high quality, suitable for news website.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // If image generation fails, return a placeholder approach
      console.log("Image generation not available, using placeholder");
      return new Response(
        JSON.stringify({ 
          imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop`,
          placeholder: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Check if response contains image data
    const content = data.choices?.[0]?.message?.content;
    
    if (content && content.includes("data:image")) {
      // Extract base64 image if present
      const imageMatch = content.match(/data:image\/[^;]+;base64,[^\s"]+/);
      if (imageMatch) {
        return new Response(
          JSON.stringify({ imageUrl: imageMatch[0] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback to Unsplash based on keywords from prompt
    const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(','));
    const unsplashUrl = `https://source.unsplash.com/1200x630/?${keywords}`;

    console.log("Using Unsplash fallback image");

    return new Response(
      JSON.stringify({ imageUrl: unsplashUrl, placeholder: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-news-image function:", error);
    
    // Always return a fallback image on error
    return new Response(
      JSON.stringify({ 
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop",
        placeholder: true,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
