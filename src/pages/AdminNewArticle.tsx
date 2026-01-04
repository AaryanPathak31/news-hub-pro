import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

const AdminNewArticle = () => {
  const navigate = useNavigate();
  const { user, isEditor, loading } = useAuth();

  if (loading) {
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

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-xl font-bold">New Article</h1>
            <Badge variant="outline">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <ArticleForm mode="create" />
      </main>
    </div>
  );
};

export default AdminNewArticle;
