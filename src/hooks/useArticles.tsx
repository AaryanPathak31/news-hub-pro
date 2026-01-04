import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { readJSONFromStorage, withTimeout, writeJSONToStorage } from '@/lib/async';

export interface DBArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  featured_image: string | null;
  category_id: string | null;
  author_id: string | null;
  status: 'draft' | 'published' | 'archived';
  is_breaking: boolean;
  is_featured: boolean;
  tags: string[];
  read_time: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; slug: string } | null;
  author_profile?: { id: string; full_name: string | null; email: string | null } | null;
}

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const CACHE_PUBLISHED_ARTICLES_KEY = 'nn_cache_published_articles_v1';
const CACHE_CATEGORIES_KEY = 'nn_cache_categories_v1';
const CACHE_ARTICLE_PREFIX = 'nn_cache_article_';

const REQUEST_TIMEOUT_MS = 10_000;
const TIMEOUT_MESSAGE = 'Backend is taking too long to respond. Please try again.';

export const useCategories = () => {
  const cached = readJSONFromStorage<DBCategory[]>(CACHE_CATEGORIES_KEY);

  return useQuery({
    queryKey: ['categories'],
    ...(cached ? { initialData: cached } : {}),
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase.from('categories').select('*').order('name'),
        REQUEST_TIMEOUT_MS,
        TIMEOUT_MESSAGE
      );

      if (error) throw error;
      const categories = data as DBCategory[];
      writeJSONToStorage(CACHE_CATEGORIES_KEY, categories);
      return categories;
    },
  });
};

async function attachAuthorProfiles(articles: any[]) {
  const authorIds = [...new Set(articles?.map((a) => a.author_id).filter(Boolean) as string[])];
  if (authorIds.length === 0) return { profiles: {} as Record<string, { id: string; full_name: string | null; email: string | null }> };

  try {
    const { data: profilesData, error } = await withTimeout(
      supabase.from('profiles').select('id, full_name, email').in('id', authorIds),
      REQUEST_TIMEOUT_MS,
      TIMEOUT_MESSAGE
    );

    if (error || !profilesData) {
      return { profiles: {} as Record<string, { id: string; full_name: string | null; email: string | null }> };
    }

    const profiles = Object.fromEntries(profilesData.map((p) => [p.id, p]));
    return { profiles };
  } catch {
    return { profiles: {} as Record<string, { id: string; full_name: string | null; email: string | null }> };
  }
}

// Light select for list views (excludes heavy fields like featured_image)
const LIST_SELECT = `
  id,
  title,
  slug,
  excerpt,
  category_id,
  author_id,
  status,
  is_breaking,
  is_featured,
  tags,
  read_time,
  view_count,
  published_at,
  created_at,
  updated_at,
  category:categories(id, name, slug)
`;

export const useArticles = (options?: { status?: 'draft' | 'published' | 'archived'; category?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['articles', options],
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select(LIST_SELECT)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await withTimeout(query, REQUEST_TIMEOUT_MS, TIMEOUT_MESSAGE);
      if (error) throw error;

      const { profiles } = await attachAuthorProfiles(data ?? []);

      return data?.map((article) => ({
        ...article,
        featured_image: null, // Not fetched in list view
        author_profile: article.author_id ? profiles[article.author_id] || null : null,
      })) as DBArticle[];
    },
  });
};

export const usePublishedArticles = () => {
  const cached = readJSONFromStorage<DBArticle[]>(CACHE_PUBLISHED_ARTICLES_KEY);

  return useQuery({
    queryKey: ['published-articles'],
    ...(cached ? { initialData: cached } : {}),
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('articles')
          .select(LIST_SELECT)
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
        REQUEST_TIMEOUT_MS,
        TIMEOUT_MESSAGE
      );

      if (error) throw error;

      const { profiles } = await attachAuthorProfiles(data ?? []);
      const result = data?.map((article) => ({
        ...article,
        featured_image: null, // Not fetched in list view
        author_profile: article.author_id ? profiles[article.author_id] || null : null,
      })) as DBArticle[];

      writeJSONToStorage(CACHE_PUBLISHED_ARTICLES_KEY, result);
      return result;
    },
  });
};

// Offline-first article cache
export const useArticleBySlug = (slug: string) => {
  const cacheKey = `${CACHE_ARTICLE_PREFIX}${slug}`;
  const cached = slug ? readJSONFromStorage<DBArticle>(cacheKey) : undefined;

  return useQuery({
    queryKey: ['article', slug],
    enabled: !!slug,
    retry: 1,
    ...(cached ? { initialData: cached } : {}),
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('articles')
          .select(
            `
          *,
          category:categories(id, name, slug)
        `
          )
          .eq('slug', slug)
          .single(),
        REQUEST_TIMEOUT_MS,
        TIMEOUT_MESSAGE
      );

      if (error) throw error;

      let author_profile = null;
      if (data?.author_id) {
        try {
          const { data: profile, error: profileError } = await withTimeout(
            supabase.from('profiles').select('id, full_name, email').eq('id', data.author_id).single(),
            REQUEST_TIMEOUT_MS,
            TIMEOUT_MESSAGE
          );
          if (!profileError) {
            author_profile = profile;
          }
        } catch {
          // Ignore profile failures
        }
      }

      const result = { ...data, author_profile } as DBArticle;
      
      // Cache the article for offline access
      writeJSONToStorage(cacheKey, result);
      
      return result;
    },
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: {
      title: string;
      slug: string;
      content: string;
      excerpt?: string | null;
      featured_image?: string | null;
      category_id?: string | null;
      author_id?: string | null;
      status?: 'draft' | 'published' | 'archived';
      is_breaking?: boolean;
      is_featured?: boolean;
      tags?: string[];
      read_time?: number;
      published_at?: string | null;
    }) => {
      const { data, error } = await supabase.from('articles').insert([article]).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      toast.success('Article created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...article }: { id: string } & Partial<Omit<DBArticle, 'id' | 'created_at' | 'updated_at' | 'category' | 'author_profile'>>) => {
      const { data, error } = await supabase.from('articles').update(article).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      toast.success('Article updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      toast.success('Article deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('article-images').upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('article-images').getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast.error('Failed to upload image: ' + error.message);
    },
  });
};
