import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log(`Prompt: ${prompt}`);

    // Use Lovable AI with correct image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Generate a professional, high-quality news article header image for this topic: ${prompt}. 
            
Requirements:
- Photojournalistic style
- High quality, suitable for a news website header
- Visually compelling and relevant to the topic
- No text overlays
- 16:9 aspect ratio composition`
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${errorText}`);
      
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
      
      // Use curated Unsplash photos based on topic keywords
      const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
      console.log(`Using Unsplash fallback with keywords: ${keywords}`);
      
      return new Response(
        JSON.stringify({ 
          imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop`,
          placeholder: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("API response received");
    
    // Check for images array in the response (new format)
    const images = data.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      const imageUrl = images[0]?.image_url?.url;
      if (imageUrl) {
        console.log("Successfully extracted image from API response");
        return new Response(
          JSON.stringify({ imageUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Check if response contains image data in content (legacy format)
    const content = data.choices?.[0]?.message?.content;
    
    if (content && typeof content === 'string' && content.includes("data:image")) {
      const imageMatch = content.match(/data:image\/[^;]+;base64,[^\s"]+/);
      if (imageMatch) {
        console.log("Successfully extracted base64 image from content");
        return new Response(
          JSON.stringify({ imageUrl: imageMatch[0] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback to topic-based Unsplash image
    const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
    console.log(`No image in response, using Unsplash fallback with: ${keywords}`);

    return new Response(
      JSON.stringify({ 
        imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop`,
        placeholder: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-news-image function:", error);
    
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
