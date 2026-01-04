import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Free RSS feeds from major news sources - with focus on Indian news
const RSS_FEEDS: Record<string, string[]> = {
  "politics": [
    "https://timesofindia.indiatimes.com/rssfeeds/1221656.cms", // TOI Politics
    "https://www.thehindu.com/news/national/feeder/default.rss", // The Hindu
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "https://feeds.bbci.co.uk/news/politics/rss.xml",
  ],
  "technology": [
    "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms", // TOI Tech
    "https://feeds.arstechnica.com/arstechnica/technology-lab",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
  ],
  "sports": [
    "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms", // TOI Sports
    "https://www.thehindu.com/sport/feeder/default.rss", // The Hindu Sports
    "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
    "https://feeds.bbci.co.uk/sport/rss.xml",
  ],
  "business": [
    "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms", // TOI Business
    "https://www.thehindu.com/business/feeder/default.rss", // The Hindu Business
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
  ],
  "entertainment": [
    "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms", // TOI Entertainment
    "https://www.thehindu.com/entertainment/feeder/default.rss", // The Hindu Entertainment
    "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",
  ],
  "health": [
    "https://timesofindia.indiatimes.com/rssfeeds/3908999.cms", // TOI Health
    "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
    "https://feeds.bbci.co.uk/news/health/rss.xml",
  ],
  "science": [
    "https://timesofindia.indiatimes.com/rssfeeds/39872987.cms", // TOI Science
    "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
  ],
  "world": [
    "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", // TOI World
    "https://www.thehindu.com/news/international/feeder/default.rss", // The Hindu World
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
  ],
  "india": [
    "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms", // TOI India
    "https://www.thehindu.com/news/national/feeder/default.rss", // The Hindu National
    "https://indianexpress.com/feed/", // Indian Express
    "https://www.ndtv.com/rss/india", // NDTV India
  ],
};

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  isIndian: boolean;
}

function parseRSSItem(item: string, source: string, category: string, isIndian: boolean): NewsItem | null {
  try {
    const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const pubDateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s);

    if (!titleMatch || !descMatch) return null;

    // Clean HTML from description
    let description = descMatch[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    return {
      title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      description: description.substring(0, 500),
      link: linkMatch?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '',
      pubDate: pubDateMatch?.[1] || new Date().toISOString(),
      source,
      category,
      isIndian,
    };
  } catch (e) {
    console.error("Error parsing RSS item:", e);
    return null;
  }
}

async function fetchRSSFeed(url: string, category: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    
    // Determine source and if it's Indian
    const isIndian = url.includes("timesofindia") || url.includes("thehindu") || 
                     url.includes("indianexpress") || url.includes("ndtv");
    
    const source = url.includes("timesofindia") ? "Times of India" :
                   url.includes("thehindu") ? "The Hindu" :
                   url.includes("indianexpress") ? "Indian Express" :
                   url.includes("ndtv") ? "NDTV" :
                   url.includes("nytimes") ? "NYTimes" : 
                   url.includes("bbc") ? "BBC" : 
                   url.includes("theverge") ? "The Verge" :
                   url.includes("techcrunch") ? "TechCrunch" :
                   url.includes("arstechnica") ? "Ars Technica" : "News";

    const items: NewsItem[] = [];
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];

    // Get more items from Indian sources
    const limit = isIndian ? 8 : 4;
    for (const itemXml of itemMatches.slice(0, limit)) {
      const item = parseRSSItem(itemXml, source, category, isIndian);
      if (item) items.push(item);
    }

    return items;
  } catch (e) {
    console.error(`Error fetching RSS feed ${url}:`, e);
    return [];
  }
}

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

      console.log(`Authenticated user ${user.id} for fetching news`);
    }

    const { category, limit = 5, focusIndian = true } = await req.json();

    let feeds: string[] = [];
    let categoryKey = category?.toLowerCase() || "";

    // Map category names to RSS feed keys
    const categoryMapping: Record<string, string> = {
      "politics": "politics",
      "technology": "technology",
      "tech": "technology",
      "sports": "sports",
      "business": "business",
      "entertainment": "entertainment",
      "health": "health",
      "science": "science",
      "world": "world",
      "international": "world",
      "india": "india",
    };

    const mappedCategory = categoryMapping[categoryKey] || "world";
    feeds = RSS_FEEDS[mappedCategory] || RSS_FEEDS["world"];
    
    // Also add India feeds if focusing on Indian news
    if (focusIndian && mappedCategory !== "india") {
      feeds = [...(RSS_FEEDS["india"] || []).slice(0, 2), ...feeds];
    }

    console.log(`Fetching news for category: ${mappedCategory}, focus Indian: ${focusIndian}`);

    const allNews: NewsItem[] = [];
    
    for (const feedUrl of feeds) {
      const items = await fetchRSSFeed(feedUrl, mappedCategory);
      allNews.push(...items);
    }

    // Sort by date, prioritizing Indian news
    const sortedNews = allNews
      .sort((a, b) => {
        // Prioritize Indian news slightly
        const indianBonus = (b.isIndian ? 1 : 0) - (a.isIndian ? 1 : 0);
        if (indianBonus !== 0) return indianBonus * 0.3;
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      })
      .slice(0, limit);

    console.log(`Found ${sortedNews.length} news items (${sortedNews.filter(n => n.isIndian).length} Indian)`);

    return new Response(JSON.stringify({ news: sortedNews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-news function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
