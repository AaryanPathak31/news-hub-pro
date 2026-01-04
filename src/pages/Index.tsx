import { SEOHead } from '@/components/SEOHead';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/news/ArticleCard';
import { CategorySection } from '@/components/news/CategorySection';
import { TrendingSidebar } from '@/components/news/TrendingSidebar';
import { BreakingNewsTicker } from '@/components/news/BreakingNewsTicker';
import { AdPlaceholder } from '@/components/news/AdPlaceholder';
import { usePublishedArticles, useCategories, DBArticle } from '@/hooks/useArticles';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import {
  generateHomeSEO,
  generateWebsiteSchema,
  generateOrganizationSchema,
} from '@/lib/seo';
import { Article } from '@/types/news';

// Helper to convert DB article to frontend Article type
const toArticle = (dbArticle: DBArticle): Article => ({
  id: dbArticle.id,
  slug: dbArticle.slug,
  title: dbArticle.title,
  excerpt: dbArticle.excerpt || '',
  content: dbArticle.content,
  featuredImage: dbArticle.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop',
  category: (dbArticle.category?.slug || 'world') as Article['category'],
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

const Index = () => {
  const seo = generateHomeSEO();
  const {
    data: dbArticles,
    isLoading,
    isError,
    refetch: refetchArticles,
  } = usePublishedArticles();
  const { refetch: refetchCategories } = useCategories();

  const articles = dbArticles?.map(toArticle) || [];

  // Breaking news - sorted by most recent first (auto-ranking)
  const breakingNews = articles
    .filter((a) => a.isBreaking)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const featuredArticles = articles.filter((a) => a.isFeatured);
  const trendingArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const latestArticles = [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 8);

  const getArticlesByCategory = (categorySlug: string) => articles.filter((a) => a.category === categorySlug).slice(0, 4);

  const technologyArticles = getArticlesByCategory('technology');
  const politicsArticles = getArticlesByCategory('politics');
  const sportsArticles = getArticlesByCategory('sports');
  const businessArticles = getArticlesByCategory('business');
  const entertainmentArticles = getArticlesByCategory('entertainment');
  const healthArticles = getArticlesByCategory('health');

  const structuredData = [generateWebsiteSchema(), generateOrganizationSchema()];

  if (isLoading && !dbArticles) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading news...</p>
        </div>
      </Layout>
    );
  }

  if (isError && (!dbArticles || dbArticles.length === 0)) {
    return (
      <>
        <SEOHead seo={seo} structuredData={structuredData} />
        <Layout>
          <div className="container py-14">
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>News service is not responding</AlertTitle>
              <AlertDescription>
                <p>We can’t load news right now. Please try again in a moment.</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => { refetchArticles(); refetchCategories(); }}>Retry</Button>
                  <Button variant="outline" asChild>
                    <a href="/auth">Login</a>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </Layout>
      </>
    );
  }

  // Show empty state if no articles
  if (articles.length === 0) {
    return (
      <>
        <SEOHead seo={seo} structuredData={structuredData} />
        <Layout>
          <div className="container py-20 text-center">
            <h2 className="font-serif text-2xl font-bold mb-4">Welcome to NoNameNews</h2>
            <p className="text-muted-foreground mb-6">No articles published yet. Check back soon for the latest news!</p>
            <p className="text-sm text-muted-foreground">
              Editors can{' '}
              <a href="/auth" className="text-primary hover:underline">
                log in
              </a>{' '}
              to create articles.
            </p>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <SEOHead seo={seo} structuredData={structuredData} />
      <Layout>
        {/* Offline banner */}
        {isError && (
          <div className="container mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Showing cached news</AlertTitle>
              <AlertDescription>
                Latest updates are temporarily unavailable.
                <Button variant="link" className="px-2" onClick={() => { refetchArticles(); refetchCategories(); }}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Breaking News Ticker - shows all breaking news, ranked by recency */}
        {breakingNews.length > 0 && <BreakingNewsTicker articles={breakingNews} />}

        {/* Header Ad */}
        <div className="container mt-4">
          <AdPlaceholder variant="leaderboard" className="w-full max-w-4xl mx-auto" />
        </div>

        {/* Breaking News Section */}
        {breakingNews.length > 0 && (
          <section className="container mt-8" aria-labelledby="breaking-news-heading">
            <h2
              id="breaking-news-heading"
              className="font-serif font-bold text-2xl mb-6 pb-3 border-b border-destructive flex items-center gap-2 text-destructive"
            >
              <span className="animate-pulse">🔴</span> Breaking News
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {breakingNews.slice(0, 4).map((article) => (
                <ArticleCard key={article.id} article={article} variant="default" showExcerpt={false} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Section */}
        <section className="container mt-8" aria-label="Featured news">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Featured Article */}
            <div className="lg:col-span-2">{(featuredArticles[0] || latestArticles[0]) && <ArticleCard article={featuredArticles[0] || latestArticles[0]} variant="featured" />}</div>

            {/* Trending Sidebar */}
            <div>
              <TrendingSidebar articles={trendingArticles.length > 0 ? trendingArticles : latestArticles.slice(0, 5)} />
            </div>
          </div>
        </section>

        {/* Latest News Section */}
        {latestArticles.length > 0 && (
          <section className="container mt-10" aria-labelledby="latest-news-heading">
            <h2 id="latest-news-heading" className="font-serif font-bold text-2xl mb-6 pb-3 border-b border-border">
              Latest News
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestArticles.slice(0, 4).map((article) => (
                <ArticleCard key={article.id} article={article} variant="default" showExcerpt={false} />
              ))}
            </div>
          </section>
        )}

        {/* Inline Ad */}
        <div className="container mt-8">
          <AdPlaceholder variant="banner" className="w-full" />
        </div>

        {/* Category Sections */}
        <div className="container">
          {technologyArticles.length > 0 && <CategorySection category="technology" articles={technologyArticles} />}
          {politicsArticles.length > 0 && <CategorySection category="politics" articles={politicsArticles} />}

          {/* Mid-page Ad */}
          <AdPlaceholder variant="banner" className="w-full my-8" />

          {sportsArticles.length > 0 && <CategorySection category="sports" articles={sportsArticles} />}
          {businessArticles.length > 0 && <CategorySection category="business" articles={businessArticles} />}
          {entertainmentArticles.length > 0 && <CategorySection category="entertainment" articles={entertainmentArticles} />}
          {healthArticles.length > 0 && <CategorySection category="health" articles={healthArticles} />}
        </div>

        {/* More Breaking News if available */}
        {breakingNews.length > 4 && (
          <section className="container mt-8" aria-labelledby="more-breaking-heading">
            <h2 id="more-breaking-heading" className="font-serif font-bold text-2xl mb-6 pb-3 border-b border-border">
              More Breaking Stories
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {breakingNews.slice(4, 10).map((article) => (
                  <ArticleCard key={article.id} article={article} variant="horizontal" />
                ))}
              </div>
              <div>
                <AdPlaceholder variant="sidebar" className="sticky top-24" />
              </div>
            </div>
          </section>
        )}

        {/* More Latest News */}
        {latestArticles.length > 4 && (
          <section className="container mt-8" aria-labelledby="more-news-heading">
            <h2 id="more-news-heading" className="font-serif font-bold text-2xl mb-6 pb-3 border-b border-border">
              More Stories
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {latestArticles.slice(4, 8).map((article) => (
                  <ArticleCard key={article.id} article={article} variant="horizontal" />
                ))}
              </div>
              <div>
                <AdPlaceholder variant="sidebar" className="sticky top-24" />
              </div>
            </div>
          </section>
        )}
      </Layout>
    </>
  );
};

export default Index;

