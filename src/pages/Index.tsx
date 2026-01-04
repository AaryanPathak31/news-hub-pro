import { SEOHead } from '@/components/SEOHead';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/news/ArticleCard';
import { CategorySection } from '@/components/news/CategorySection';
import { TrendingSidebar } from '@/components/news/TrendingSidebar';
import { BreakingNewsTicker } from '@/components/news/BreakingNewsTicker';
import { AdPlaceholder } from '@/components/news/AdPlaceholder';
import {
  getBreakingNews,
  getFeaturedArticles,
  getTrendingArticles,
  getLatestArticles,
  getArticlesByCategory,
} from '@/data/mockArticles';
import {
  generateHomeSEO,
  generateWebsiteSchema,
  generateOrganizationSchema,
} from '@/lib/seo';

const Index = () => {
  const seo = generateHomeSEO();
  const breakingNews = getBreakingNews();
  const featuredArticles = getFeaturedArticles();
  const trendingArticles = getTrendingArticles(5);
  const latestArticles = getLatestArticles(8);
  const technologyArticles = getArticlesByCategory('technology', 4);
  const politicsArticles = getArticlesByCategory('politics', 4);
  const sportsArticles = getArticlesByCategory('sports', 4);
  const businessArticles = getArticlesByCategory('business', 4);

  const structuredData = [generateWebsiteSchema(), generateOrganizationSchema()];

  return (
    <>
      <SEOHead seo={seo} structuredData={structuredData} />
      <Layout>
        {/* Breaking News Ticker */}
        {breakingNews.length > 0 && <BreakingNewsTicker articles={breakingNews} />}

        {/* Header Ad */}
        <div className="container mt-4">
          <AdPlaceholder variant="leaderboard" className="w-full max-w-4xl mx-auto" />
        </div>

        {/* Featured Section */}
        <section className="container mt-8" aria-label="Featured news">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Featured Article */}
            <div className="lg:col-span-2">
              {featuredArticles[0] && (
                <ArticleCard article={featuredArticles[0]} variant="featured" />
              )}
            </div>

            {/* Trending Sidebar */}
            <div>
              <TrendingSidebar articles={trendingArticles} />
            </div>
          </div>
        </section>

        {/* Latest News Section */}
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

        {/* Inline Ad */}
        <div className="container mt-8">
          <AdPlaceholder variant="banner" className="w-full" />
        </div>

        {/* Category Sections */}
        <div className="container">
          <CategorySection category="technology" articles={technologyArticles} />
          <CategorySection category="politics" articles={politicsArticles} />
          
          {/* Mid-page Ad */}
          <AdPlaceholder variant="banner" className="w-full my-8" />
          
          <CategorySection category="sports" articles={sportsArticles} />
          <CategorySection category="business" articles={businessArticles} />
        </div>

        {/* More Latest News */}
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
      </Layout>
    </>
  );
};

export default Index;
