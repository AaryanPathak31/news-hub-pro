import { fetchNews } from './fetch-news.js';
import { processNewsItem } from './process-content.js';
import { generateAndUploadImage } from './generate-images.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Removed frontend import to avoid nodejs runtime issues

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Simple slugify fallback
function makeSlug(text: string) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function getOrCreateCategory(name: string) {
    if (!supabase) return null;

    // Normalize category name
    let finalName = name || 'General';
    // Capitalize first letter
    finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);

    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', finalName)
        .maybeSingle();

    if (existing) return existing.id;

    // Create if not exists
    const { data: newVal, error } = await supabase
        .from('categories')
        .insert({ name: finalName, slug: makeSlug(finalName) })
        .select('id')
        .single();

    if (error) {
        console.error(`Error creating category ${finalName}:`, error);
        return null;
    }
    return newVal.id;
}

async function getSystemAuthorId() {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    return data?.id || null;
}

async function run() {
    console.log('Starting News Automation Pipeline...');

    if (!supabase) {
        console.error('Supabase credentials missing. Aborting.');
        process.exit(1);
    }

    // 1. Fetch Raw News
    const rawItems = await fetchNews();
    console.log(`Fetched ${rawItems.length} raw items.`);

    const authorId = await getSystemAuthorId();

    for (const item of rawItems) {
        // Check if article with same title already exists (simple dedup)
        const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('title', item.title)
            .maybeSingle();

        if (existing) {
            // console.log(`Skipping duplicate: ${item.title}`);
            continue;
        }

        // 2. Process with AI
        const processed = await processNewsItem(item);
        if (!processed) continue;

        const slug = makeSlug(processed.title);

        // 3. Generate Image
        const imageUrl = await generateAndUploadImage(processed.title, slug);

        // 4. Resolve Category
        const categoryId = await getOrCreateCategory(processed.category);

        // 5. Save to Database
        const { error } = await supabase
            .from('articles')
            .insert({
                title: processed.title,
                slug: slug,
                content: processed.content,
                excerpt: processed.excerpt,
                category_id: categoryId,
                featured_image: imageUrl,
                status: 'published',
                published_at: new Date().toISOString(),
                author_id: authorId,
                tags: processed.tags,
                is_breaking: false,
                is_featured: (processed.category === 'India')
            });

        if (error) {
            console.error('Error saving article:', error);
        } else {
            console.log(`Successfully published: ${processed.title}`);
        }
    }

    console.log('Pipeline finished.');
}

run();
