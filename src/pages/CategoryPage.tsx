import { useParams } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/news/ArticleCard';
import { Breadcrumb } from '@/components/news/Breadcrumb';
import { TrendingSidebar } from '@/components/news/TrendingSidebar';
import { AdPlaceholder } from '@/components/news/AdPlaceholder';
import { getArticlesByCategory, getTrendingArticles } from '@/data/mockArticles';
import { generateCategorySEO, generateBreadcrumbSchema } from '@/lib/seo';
import { getCategoryInfo, CATEGORIES, Category } from '@/types/news';
import NotFound from './NotFound';

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  
  const isValidCategory = CATEGORIES.some(c => c.slug === category);
  
  if (!isValidCategory || !category) {
    return <NotFound />;
  }

  const categoryInfo = getCategoryInfo(category as Category);
  const articles = getArticlesByCategory(category);
  const trendingArticles = getTrendingArticles(5);

  const seo = generateCategorySEO(categoryInfo);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://nonamenews.com' },
    { name: categoryInfo.name, url: `https://nonamenews.com/${category}` },
  ]);

  const [featuredArticle, ...restArticles] = articles;

  return (
    <>
      <SEOHead seo={seo} structuredData={breadcrumbSchema} />
      <Layout>
        <div className="container">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: categoryInfo.name }]} />

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
                  <>
                    <ArticleCard key={article.id} article={article} variant="horizontal" />
                    {/* Insert ad every 4 articles */}
                    {(index + 1) % 4 === 0 && index < restArticles.length - 1 && (
                      <AdPlaceholder key={`ad-${index}`} variant="inline" className="w-full" />
                    )}
                  </>
                ))}
              </div>

              {articles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No articles found in this category.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <TrendingSidebar articles={trendingArticles} />
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
