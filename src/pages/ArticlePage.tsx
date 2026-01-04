import { useParams } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/news/ArticleCard';
import { Breadcrumb } from '@/components/news/Breadcrumb';
import { ShareButtons } from '@/components/news/ShareButtons';
import { TrendingSidebar } from '@/components/news/TrendingSidebar';
import { AdPlaceholder } from '@/components/news/AdPlaceholder';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { useArticleBySlug, usePublishedArticles, DBArticle } from '@/hooks/useArticles';
import { generateArticleSEO, generateNewsArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { getCategoryInfo, Article, Category } from '@/types/news';
import { Clock, Calendar, RefreshCw, User } from 'lucide-react';
import { format } from 'date-fns';
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
    role: 'Reporter'
  },
  publishedAt: dbArticle.published_at || dbArticle.created_at,
  updatedAt: dbArticle.updated_at,
  readingTime: dbArticle.read_time,
  isBreaking: dbArticle.is_breaking,
  isFeatured: dbArticle.is_featured,
  views: dbArticle.view_count
});

const ArticlePage = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  
  const { data: dbArticle, isLoading } = useArticleBySlug(slug || '');
  const { data: allArticles } = usePublishedArticles();

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (!dbArticle) {
    return <NotFound />;
  }

  const article = toArticle(dbArticle);
  const articles = allArticles?.map(toArticle) || [];
  
  const relatedArticles = articles
    .filter(a => a.id !== article.id && (a.category === article.category || a.tags.some(tag => article.tags.includes(tag))))
    .slice(0, 4);
  
  const trendingArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const categoryInfo = getCategoryInfo(article.category);
  
  const seo = generateArticleSEO(article);
  const articleSchema = generateNewsArticleSchema(article);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://nonamenews.com' },
    { name: categoryInfo.name, url: `https://nonamenews.com/${article.category}` },
    { name: article.title, url: `https://nonamenews.com/${article.category}/${article.slug}` },
  ]);

  const publishedDate = format(new Date(article.publishedAt), 'MMMM d, yyyy');
  const publishedTime = format(new Date(article.publishedAt), 'h:mm a');
  const updatedDate = article.updatedAt 
    ? format(new Date(article.updatedAt), 'MMMM d, yyyy, h:mm a')
    : null;

  const articleUrl = `https://nonamenews.com/${article.category}/${article.slug}`;

  return (
    <>
      <SEOHead seo={seo} structuredData={[articleSchema, breadcrumbSchema]} />
      <Layout>
        <article className="container" itemScope itemType="https://schema.org/NewsArticle">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: categoryInfo.name, href: `/${article.category}` },
              { label: article.title },
            ]}
          />

          {/* Header Ad */}
          <AdPlaceholder variant="leaderboard" className="w-full max-w-4xl mx-auto mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Article Header */}
              <header className="mb-6">
                {article.isBreaking && (
                  <span className="inline-block px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold uppercase tracking-wide rounded mb-3 animate-breaking">
                    Breaking News
                  </span>
                )}
                <CategoryBadge category={article.category} size="md" className="mb-4" />
                
                <h1 
                  className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-4"
                  itemProp="headline"
                >
                  {article.title}
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed mb-6" itemProp="description">
                  {article.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span itemProp="author" itemScope itemType="https://schema.org/Person">
                      <span itemProp="name">{article.author.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={article.publishedAt} itemProp="datePublished">
                      {publishedDate} at {publishedTime}
                    </time>
                  </div>
                  {updatedDate && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <time dateTime={article.updatedAt} itemProp="dateModified">
                        Updated: {updatedDate}
                      </time>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{article.readingTime} min read</span>
                  </div>
                </div>
              </header>

              {/* Share Buttons */}
              <div className="py-4 border-b border-border mb-6">
                <ShareButtons url={articleUrl} title={article.title} />
              </div>

              {/* Featured Image */}
              <figure className="mb-8">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full aspect-video object-cover rounded-lg"
                  itemProp="image"
                  loading="eager"
                />
              </figure>

              {/* Article Body */}
              <div 
                className="article-body font-sans"
                itemProp="articleBody"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* In-article Ad */}
              <AdPlaceholder variant="inline" className="w-full my-8" />

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`/tags/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full hover:bg-accent transition-colors"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              </div>

              {/* Share Buttons Bottom */}
              <div className="mt-8 py-4 border-t border-border">
                <ShareButtons url={articleUrl} title={article.title} />
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mt-10" aria-labelledby="related-heading">
                  <h2 id="related-heading" className="font-serif font-bold text-2xl mb-6 pb-3 border-b border-border">
                    Related Articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedArticles.map((relatedArticle) => (
                      <ArticleCard
                        key={relatedArticle.id}
                        article={relatedArticle}
                        variant="default"
                        showExcerpt={false}
                      />
                    ))}
                  </div>
                </section>
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
        </article>
      </Layout>
    </>
  );
};

export default ArticlePage;
