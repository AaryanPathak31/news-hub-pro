import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function generateAndUploadImage(prompt: string, slug: string): Promise<string | null> {
    const encodedPrompt = encodeURIComponent(prompt + " photorealistic, high quality, news style");
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=800&height=400&seed=${Math.floor(Math.random() * 1000)}`;

    try {
        console.log(`Generating image for: ${prompt}`);

        // 1. Fetch the image from Pollinations
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image from Pollinations');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Upload to Supabase Storage
        if (!supabase) {
            console.warn('Supabase credentials missing. Returning raw Pollinations URL.');
            return imageUrl;
        }

        const fileName = `${slug}-${Date.now()}.jpg`;
        const { data, error } = await supabase
            .storage
            .from('article-images')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.error('Supabase upload error:', error);
            // Fallback to hotlinking if upload fails
            return imageUrl;
        }

        // 3. Get Public URL
        const { data: publicData } = supabase
            .storage
            .from('article-images')
            .getPublicUrl(fileName);

        return publicData.publicUrl;

    } catch (error) {
        console.error('Error generating/uploading image:', error);
        return null;
    }
}
