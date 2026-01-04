import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Article, Category, getCategoryInfo } from '@/types/news';
import { ArticleCard } from './ArticleCard';
import { cn } from '@/lib/utils';

interface CategorySectionProps {
  category: Category;
  articles: Article[];
  className?: string;
}

export const CategorySection = ({ category, articles, className }: CategorySectionProps) => {
  const categoryInfo = getCategoryInfo(category);

  if (articles.length === 0) return null;

  const [mainArticle, ...sideArticles] = articles;

  return (
    <section className={cn("py-8", className)} aria-labelledby={`${category}-heading`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("w-1 h-8 rounded-full", categoryInfo.color.replace('category-', 'bg-category-'))} />
          <h2 id={`${category}-heading`} className="font-serif font-bold text-2xl">
            {categoryInfo.name}
          </h2>
        </div>
        <Link
          to={`/${category}`}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Article */}
        <div className="lg:col-span-2">
          <ArticleCard article={mainArticle} variant="default" />
        </div>

        {/* Side Articles */}
        <div className="space-y-4">
          {sideArticles.slice(0, 3).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="compact"
              className="pb-4 border-b border-border last:border-0 last:pb-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
