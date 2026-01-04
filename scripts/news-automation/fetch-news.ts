import Parser from 'rss-parser';
import { RSS_FEEDS } from './constants.js';

const parser = new Parser();

export interface RawNewsItem {
    title: string;
    link: string;
    pubDate: string;
    content: string;
    contentSnippet?: string;
    source: string;
    category: string;
}

export async function fetchNews(): Promise<RawNewsItem[]> {
    console.log('Fetching news from RSS feeds...');
    const allNews: RawNewsItem[] = [];

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`Fetching ${feed.source}...`);
            const parsed = await parser.parseURL(feed.url);

            // Take top 2 items from each feed to avoid spamming
            const topItems = parsed.items.slice(0, 2).map((item) => ({
                title: item.title || '',
                link: item.link || '',
                pubDate: item.pubDate || new Date().toISOString(),
                content: item.content || item.contentSnippet || '',
                contentSnippet: item.contentSnippet,
                source: feed.source,
                category: feed.category
            }));

            allNews.push(...topItems);
        } catch (error) {
            console.error(`Error fetching ${feed.source}:`, error);
        }
    }

    return allNews;
}
