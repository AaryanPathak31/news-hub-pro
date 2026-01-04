import { GoogleGenerativeAI } from '@google/generative-ai';
import { RawNewsItem } from './fetch-news.js';
import { SYSTEM_PROMPT } from './constants.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ProcessedArticle {
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    original_url: string;
    source: string;
    category: string;
}

export async function processNewsItem(item: RawNewsItem): Promise<ProcessedArticle | null> {
    if (!genAI) {
        console.warn('GEMINI_API_KEY not found. Skipping AI rewriting.');
        return null;
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
    });

    const prompt = `
    Original Title: ${item.title}
    Original Content: ${item.content}
    
    Rewrite this article following the system instructions.
  `;

    try {
        console.log(`Processing article: ${item.title}`);
        const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        return {
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            tags: data.tags || [],
            original_url: item.link,
            source: item.source,
            category: item.category
        };

    } catch (error) {
        console.error('Error processing article with AI:', error);
        return null;
    }
}
