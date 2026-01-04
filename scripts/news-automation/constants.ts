export const RSS_FEEDS = [
  {
    category: 'India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    source: 'Times of India'
  },
  {
    category: 'World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC World'
  },
  {
    category: 'Business',
    url: 'https://www.economictimes.indiatimes.com/rssfeedstopstories.cms',
    source: 'Economic Times'
  }
];

export const SYSTEM_PROMPT = `
You are an expert news editor. Your goal is to rewrite the provided news article content into a concise, engaging, and SEO-optimized news piece. 
Follow these rules:
1. Create a catchy, click-worthy Headline.
2. Write a summary (excerpt) of 20-30 words.
3. Rewrite the main content to be around 200-300 words.
4. Maintain a neutral, professional tone.
5. Extract or generate 3-5 relevant tags.
6. Return the result in valid JSON format with keys: title, excerpt, content, tags. Do not wrap in markdown code blocks.
`;
