import { useParams } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/news/ArticleCard';
import { Breadcrumb } from '@/components/news/Breadcrumb';
import { TrendingSidebar } from '@/components/news/TrendingSidebar';
import { AdPlaceholder } from '@/components/news/AdPlaceholder';
import { usePublishedArticles, DBArticle } from '@/hooks/useArticles';
import { generateCategorySEO, generateBreadcrumbSchema } from '@/lib/seo';
import { getCategoryInfo, CATEGORIES, Category, Article } from '@/types/news';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import NotFound from './NotFound';

// Helper to convert DB article to frontend Article type
const toArticle = (dbArticle: DBArticle): Article => ({
  id: dbArticle.id,
  slug: dbArticle.slug,
  title: dbArticle.title,
  excerpt: dbArticle.excerpt || '',
  content: dbArticle.content,
  featuredImage: dbArticle.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop',
  category: (dbArticle.category?.slug || 'world') as Category,
  tags: dbArticle.tags || [],
  author: {
    id: dbArticle.author_id || '1',
    name: dbArticle.author_profile?.full_name || 'Staff Writer',
    role: 'Reporter',
  },
  publishedAt: dbArticle.published_at || dbArticle.created_at,
  updatedAt: dbArticle.updated_at,
  readingTime: dbArticle.read_time,
  isBreaking: dbArticle.is_breaking,
  isFeatured: dbArticle.is_featured,
  views: dbArticle.view_count,
});

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const {
    data: allArticles,
    isLoading,
    isError,
    refetch,
  } = usePublishedArticles();

  const isValidCategory = CATEGORIES.some((c) => c.slug === category);

  if (!isValidCategory || !category) {
    return <NotFound />;
  }

  const categoryInfo = getCategoryInfo(category as Category);

  // Handle "breaking" as a special case - fetch articles with is_breaking = true
  // For other categories, filter by category slug
  const articles =
    allArticles
      ?.map(toArticle)
      .filter((a) => {
        if (category === 'breaking') {
          return a.isBreaking === true;
        }
        return a.category === category;
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()) || [];

  const trendingArticles =
    allArticles
      ?.map(toArticle)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5) || [];

  const seo = generateCategorySEO(categoryInfo);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://nonamenews.com' },
    { name: categoryInfo.name, url: `https://nonamenews.com/${category}` },
  ]);

  const [featuredArticle, ...restArticles] = articles;

  if (isLoading && !allArticles) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </Layout>
    );
  }

  if (isError && (!allArticles || allArticles.length === 0)) {
    return (
      <Layout>
        <div className="container py-14">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>News service is not responding</AlertTitle>
            <AlertDescription>
              <p>We can’t load articles right now. Please try again in a moment.</p>
              <div className="mt-4">
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <SEOHead seo={seo} structuredData={breadcrumbSchema} />
      <Layout>
        <div className="container">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: categoryInfo.name }]} />

          {/* Offline banner */}
          {isError && (
            <div className="mb-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Showing cached news</AlertTitle>
                <AlertDescription>
                  Latest updates are temporarily unavailable.
                  <Button variant="link" className="px-2" onClick={() => refetch()}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Header Ad */}
          <AdPlaceholder variant="leaderboard" className="w-full max-w-4xl mx-auto mb-6" />

          {/* Category Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-1.5 h-10 rounded-full ${categoryInfo.color.replace('category-', 'bg-category-')}`} />
              <h1 className="font-serif font-bold text-4xl md:text-5xl">{categoryInfo.name}</h1>
            </div>
            <p className="text-lg text-muted-foreground mt-2">{categoryInfo.description}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Featured Article */}
              {featuredArticle && (
                <div className="mb-8">
                  <ArticleCard article={featuredArticle} variant="featured" />
                </div>
              )}

              {/* In-feed Ad */}
              <AdPlaceholder variant="banner" className="w-full mb-8" />

              {/* Article List */}
              <div className="space-y-6">
                {restArticles.map((article, index) => (
                  <div key={article.id}>
                    <ArticleCard article={article} variant="horizontal" />
                    {/* Insert ad every 4 articles */}
                    {(index + 1) % 4 === 0 && index < restArticles.length - 1 && (
                      <AdPlaceholder variant="inline" className="w-full mt-6" />
                    )}
                  </div>
                ))}
              </div>

              {articles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No articles found in this category yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back soon for the latest {categoryInfo.name.toLowerCase()} news!
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="sticky top-24 space-y-6">
                {trendingArticles.length > 0 && <TrendingSidebar articles={trendingArticles} />}
                <AdPlaceholder variant="sidebar" />
              </div>
            </aside>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CategoryPage;

