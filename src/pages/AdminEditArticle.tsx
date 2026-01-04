import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DBArticle } from '@/hooks/useArticles';

const AdminEditArticle = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isEditor, loading: authLoading } = useAuth();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('id', id)
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
    enabled: !!id
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isEditor) {
    return <Navigate to="/admin" replace />;
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-xl font-bold">Edit Article</h1>
            <Badge variant="outline">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <ArticleForm article={article} mode="edit" />
      </main>
    </div>
  );
};

export default AdminEditArticle;
