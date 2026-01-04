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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a service role call (internal)
    const isServiceRole = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    
    if (!isServiceRole) {
      // Extract the JWT token from the Authorization header
      const token = authHeader.replace(/^Bearer\s+/i, "");
      
      // Verify user authentication
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Pass the token explicitly to getUser for edge function context
      const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
      if (authError || !user) {
        console.error("Authentication failed:", authError?.message);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check user has editor or admin role
      const { data: roleData } = await userSupabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      const { data: editorData } = await userSupabase
        .rpc('has_role', { _user_id: user.id, _role: 'editor' });

      if (!roleData && !editorData) {
        console.error("User lacks required role:", user.id);
        return new Response(
          JSON.stringify({ error: "Forbidden: Editor or Admin role required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Authenticated user ${user.id} for image generation`);
    }

    const { prompt, articleSlug } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating image for: ${articleSlug}`);
    console.log(`Prompt: ${prompt}`);

    const fallback = () => {
      const keywords = encodeURIComponent(String(prompt || '').split(' ').slice(0, 3).join(' '));
      console.log(`Using Unsplash fallback with keywords: ${keywords}`);
      return new Response(
        JSON.stringify({
          imageUrl: `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop`,
          placeholder: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    };

    // Use Lovable AI with correct image generation model (with timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
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
- 16:9 aspect ratio composition`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });
    } catch (e) {
      console.error("Image generation request failed (timeout/network):", e);
      return fallback();
    } finally {
      clearTimeout(timeout);
    }

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

      return fallback();
    }

    const data = await response.json();
    console.log("API response received");

    // Preferred: hosted image URL from the model output
    const images = data.choices?.[0]?.message?.images;
    const rawUrl = images?.[0]?.image_url?.url;

    // Never store base64/data URLs in the DB (they are huge and can break page loads)
    if (rawUrl && typeof rawUrl === "string" && rawUrl.startsWith("data:image")) {
      console.log("Model returned a data URL; using fallback instead");
      return fallback();
    }

    if (rawUrl && typeof rawUrl === "string") {
      console.log("Successfully extracted image URL from API response");
      return new Response(JSON.stringify({ imageUrl: rawUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no image URL was returned, use fallback
    return fallback();
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
