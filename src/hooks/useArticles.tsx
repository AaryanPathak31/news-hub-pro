import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DBArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  // NOTE: list queries intentionally omit heavy fields like `content`
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

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DBCategory[];
    }
  });
};

export const useArticles = (options?: { status?: 'draft' | 'published' | 'archived'; category?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['articles', options],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
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
        `)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch author profiles separately
      const authorIds = [...new Set(data?.map(a => a.author_id).filter(Boolean) as string[])];
      let profiles: Record<string, { id: string; full_name: string | null; email: string | null }> = {};
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', authorIds);
        
        if (profilesData) {
          profiles = Object.fromEntries(profilesData.map(p => [p.id, p]));
        }
      }

      return data?.map(article => ({
        ...article,
        author_profile: article.author_id ? profiles[article.author_id] || null : null
      })) as DBArticle[];
    }
  });
};

export const usePublishedArticles = () => {
  return useQuery({
    queryKey: ['published-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
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
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      
      const authorIds = [...new Set(data?.map(a => a.author_id).filter(Boolean) as string[])];
      let profiles: Record<string, { id: string; full_name: string | null; email: string | null }> = {};
      
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', authorIds);
        
        if (profilesData) {
          profiles = Object.fromEntries(profilesData.map(p => [p.id, p]));
        }
      }

      return data?.map(article => ({
        ...article,
        author_profile: article.author_id ? profiles[article.author_id] || null : null
      })) as DBArticle[];
    }
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      
      let author_profile = null;
      if (data?.author_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', data.author_id)
          .single();
        author_profile = profile;
      }

      return { ...data, author_profile } as DBArticle;
    },
    enabled: !!slug
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
      const { data, error } = await supabase
        .from('articles')
        .insert([article])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...article }: { id: string } & Partial<Omit<DBArticle, 'id' | 'created_at' | 'updated_at' | 'category' | 'author_profile'>>) => {
      const { data, error } = await supabase
        .from('articles')
        .update(article)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast.error('Failed to upload image: ' + error.message);
    }
  });
};
