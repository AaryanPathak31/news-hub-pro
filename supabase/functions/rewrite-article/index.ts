import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const languageInstructions: Record<string, string> = {
  en: "Write the article in English.",
  es: "Escribe el artículo en español (Spanish).",
  fr: "Écrivez l'article en français (French).",
  de: "Schreiben Sie den Artikel auf Deutsch (German).",
  it: "Scrivi l'articolo in italiano (Italian).",
  pt: "Escreva o artigo em português (Portuguese).",
  zh: "用中文撰写文章 (Chinese).",
  ja: "記事を日本語で書いてください (Japanese).",
  ko: "기사를 한국어로 작성하세요 (Korean).",
  ar: "اكتب المقال بالعربية (Arabic).",
  hi: "लेख हिंदी में लिखें (Hindi).",
  ru: "Напишите статью на русском языке (Russian).",
  bn: "নিবন্ধটি বাংলায় লিখুন (Bengali).",
  ta: "கட்டுரையை தமிழில் எழுதுங்கள் (Tamil).",
  te: "వ్యాసాన్ని తెలుగులో వ్రాయండి (Telugu).",
  mr: "लेख मराठीत लिहा (Marathi).",
  gu: "લેખ ગુજરાતીમાં લખો (Gujarati).",
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

      console.log(`Authenticated user ${user.id} with role: ${roleData ? 'admin' : 'editor'}`);
    }

    const { title, description, source, language = "en", optimizeSEO = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = languageInstructions[language] || languageInstructions.en;
    console.log(`Rewriting article: ${title} in language: ${language}, SEO optimized: ${optimizeSEO}`);

    const seoInstructions = optimizeSEO ? `
SEO OPTIMIZATION REQUIREMENTS:
1. Use the primary keyword in the first paragraph
2. Include semantic keywords naturally throughout
3. Use H2 and H3 headings with keywords
4. Write a compelling meta description (excerpt)
5. Include internal linking suggestions in content
6. Use short paragraphs (2-3 sentences each)
7. Include bullet points or numbered lists where appropriate
8. Add a strong hook in the first sentence
9. Make headlines attention-grabbing but accurate
10. Target 500-800 words for better SEO ranking
` : '';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional news writer and SEO expert. Your task is to completely rewrite news articles to be original while maintaining factual accuracy and optimizing for search engines.

IMPORTANT RULES:
1. Create a completely NEW and UNIQUE article - do not copy any phrases from the original
2. Maintain all factual information but express it in your own words
3. Use a professional, engaging news writing style
4. The article should be 500-800 words for better SEO
5. Include relevant context and background information
6. Write in an objective, journalistic tone
7. ${langInstruction}
${seoInstructions}

Respond with a JSON object containing:
- "title": A new, SEO-optimized headline (60 characters max, include primary keyword)
- "content": The full rewritten article in HTML format with <p>, <h2>, <h3>, <ul>, <li> tags. Include proper heading structure.
- "excerpt": A compelling meta description (150-160 characters, include keyword)
- "imagePrompt": A detailed prompt to generate a relevant image for this article (describe scene, style, colors - always in English)
- "seoKeywords": An array of 5-8 relevant SEO keywords for this article`
          },
          {
            role: "user",
            content: `Please rewrite this news article with SEO optimization:

Original Title: ${title}

Original Summary: ${description}

Source: ${source}

Create a completely original, SEO-optimized article based on this news. ${langInstruction}`
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    console.log("Article rewritten successfully with SEO optimization");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rewrite-article function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
