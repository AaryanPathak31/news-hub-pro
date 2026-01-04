import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Free RSS feeds from major news sources
const RSS_FEEDS: Record<string, string[]> = {
  "politics": [
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "https://feeds.bbci.co.uk/news/politics/rss.xml",
  ],
  "technology": [
    "https://feeds.arstechnica.com/arstechnica/technology-lab",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
  ],
  "sports": [
    "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
    "https://feeds.bbci.co.uk/sport/rss.xml",
  ],
  "business": [
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
  ],
  "entertainment": [
    "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",
  ],
  "health": [
    "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
    "https://feeds.bbci.co.uk/news/health/rss.xml",
  ],
  "science": [
    "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
  ],
  "world": [
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
  ],
};

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

function parseRSSItem(item: string, source: string, category: string): NewsItem | null {
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
    const source = url.includes("nytimes") ? "NYTimes" : 
                   url.includes("bbc") ? "BBC" : 
                   url.includes("theverge") ? "The Verge" :
                   url.includes("techcrunch") ? "TechCrunch" :
                   url.includes("arstechnica") ? "Ars Technica" : "News";

    const items: NewsItem[] = [];
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, 5)) {
      const item = parseRSSItem(itemXml, source, category);
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
    const { category, limit = 5 } = await req.json();

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
    };

    const mappedCategory = categoryMapping[categoryKey] || "world";
    feeds = RSS_FEEDS[mappedCategory] || RSS_FEEDS["world"];

    console.log(`Fetching news for category: ${mappedCategory}`);

    const allNews: NewsItem[] = [];
    
    for (const feedUrl of feeds) {
      const items = await fetchRSSFeed(feedUrl, mappedCategory);
      allNews.push(...items);
    }

    // Sort by date and limit
    const sortedNews = allNews
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit);

    console.log(`Found ${sortedNews.length} news items`);

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
