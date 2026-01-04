import { useState, lazy, Suspense } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArticles, useDeleteArticle, DBArticle } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit2, Trash2, Eye, LogOut, FileText, Send, Archive, BarChart3, Users, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

// Lazy load heavy components
const AnalyticsDashboard = lazy(() => import('@/components/admin/AnalyticsDashboard'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const AINewsGenerator = lazy(() => import('@/components/admin/AINewsGenerator').then(m => ({ default: m.AINewsGenerator })));

const ARTICLES_PER_PAGE = 20;

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEditor, loading, signOut } = useAuth();
  const { data: articles, isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('articles');
  const [currentPage, setCurrentPage] = useState(1);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need editor or admin permissions to access this page. Please contact an administrator.
            </p>
            <Button onClick={() => signOut()} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const draftArticles = articles?.filter(a => a.status === 'draft') || [];
  const publishedArticles = articles?.filter(a => a.status === 'published') || [];
  const archivedArticles = articles?.filter(a => a.status === 'archived') || [];

  const handleDelete = async () => {
    if (deleteId) {
      await deleteArticle.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-600">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Pagination logic
  const paginateArticles = (articleList: DBArticle[]) => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    return articleList.slice(startIndex, endIndex);
  };

  const getTotalPages = (articleList: DBArticle[]) => Math.ceil(articleList.length / ARTICLES_PER_PAGE);

  const ArticleTable = ({ articles: articleList, showPagination = true }: { articles: DBArticle[]; showPagination?: boolean }) => {
    const displayArticles = showPagination ? paginateArticles(articleList) : articleList;
    const totalPages = getTotalPages(articleList);

    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No articles found
                </TableCell>
              </TableRow>
            ) : (
              displayArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {article.title}
                  </TableCell>
                  <TableCell>{article.category?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(article.status)}</TableCell>
                  <TableCell>
                    {format(new Date(article.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {article.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/${article.category?.slug}/${article.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/edit/${article.id}`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteId(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * ARTICLES_PER_PAGE) + 1} - {Math.min(currentPage * ARTICLES_PER_PAGE, articleList.length)} of {articleList.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const LoadingFallback = () => (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl font-bold">NoNameNews</h1>
            <Badge variant="outline">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              View Site
            </Button>
            <Button variant="ghost" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="ai-generator" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generator
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary rounded-full">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{draftArticles.length}</p>
                      <p className="text-muted-foreground">Drafts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Send className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{publishedArticles.length}</p>
                      <p className="text-muted-foreground">Published</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      <Archive className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{archivedArticles.length}</p>
                      <p className="text-muted-foreground">Archived</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Articles Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Articles</CardTitle>
                <Button onClick={() => navigate('/admin/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Tabs defaultValue="all" onValueChange={() => setCurrentPage(1)}>
                    <TabsList>
                      <TabsTrigger value="all">All ({articles?.length || 0})</TabsTrigger>
                      <TabsTrigger value="published">Published ({publishedArticles.length})</TabsTrigger>
                      <TabsTrigger value="drafts">Drafts ({draftArticles.length})</TabsTrigger>
                      <TabsTrigger value="archived">Archived ({archivedArticles.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-4">
                      <ArticleTable articles={articles || []} />
                    </TabsContent>
                    <TabsContent value="published" className="mt-4">
                      <ArticleTable articles={publishedArticles} />
                    </TabsContent>
                    <TabsContent value="drafts" className="mt-4">
                      <ArticleTable articles={draftArticles} />
                    </TabsContent>
                    <TabsContent value="archived" className="mt-4">
                      <ArticleTable articles={archivedArticles} />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Generator Tab - Lazy Loaded */}
          <TabsContent value="ai-generator">
            <Suspense fallback={<LoadingFallback />}>
              <AINewsGenerator />
            </Suspense>
          </TabsContent>

          {/* Analytics Tab - Lazy Loaded */}
          <TabsContent value="analytics">
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsDashboard articles={articles || []} />
            </Suspense>
          </TabsContent>

          {/* Users Tab (Admin only) - Lazy Loaded */}
          {isAdmin && (
            <TabsContent value="users">
              <Suspense fallback={<LoadingFallback />}>
                <UserManagement />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
