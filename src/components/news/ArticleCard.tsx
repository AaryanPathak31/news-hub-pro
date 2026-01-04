import { Link } from 'react-router-dom';
import { Clock, TrendingUp } from 'lucide-react';
import { Article } from '@/types/news';
import { CategoryBadge } from './CategoryBadge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact' | 'horizontal';
  showImage?: boolean;
  showExcerpt?: boolean;
  className?: string;
}

export const ArticleCard = ({
  article,
  variant = 'default',
  showImage = true,
  showExcerpt = true,
  className,
}: ArticleCardProps) => {
  const articleUrl = `/${article.category}/${article.slug}`;
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  if (variant === 'compact') {
    return (
      <article className={cn("group", className)}>
        <Link to={articleUrl} className="flex gap-3">
          {showImage && (
            <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-sm leading-tight line-clamp-2 group-hover:text-destructive transition-colors">
              {article.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className={cn("group border-b border-border pb-4", className)}>
        <Link to={articleUrl} className="flex gap-4">
          {showImage && (
            <div className="flex-shrink-0 w-32 md:w-48 aspect-video overflow-hidden rounded-md">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CategoryBadge category={article.category} size="sm" />
            <h3 className="font-serif font-bold text-lg mt-2 line-clamp-2 group-hover:text-destructive transition-colors">
              {article.title}
            </h3>
            {showExcerpt && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 hidden md:block">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{article.author.name}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min read
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article className={cn("group relative", className)}>
        <Link to={articleUrl} className="block">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-lg">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
              {article.isBreaking && (
                <span className="inline-block px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wide rounded mb-2 animate-breaking">
                  Breaking
                </span>
              )}
              <CategoryBadge category={article.category} size="md" className="mb-3" />
              <h2 className="font-serif font-bold text-xl md:text-3xl lg:text-4xl text-white leading-tight">
                {article.title}
              </h2>
              <p className="text-white/80 mt-2 md:mt-3 text-sm md:text-base line-clamp-2 max-w-3xl">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs md:text-sm text-white/70">
                <span>{article.author.name}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  {article.readingTime} min read
                </span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className={cn("group", className)}>
      <Link to={articleUrl} className="block">
        {showImage && (
          <div className="aspect-video overflow-hidden rounded-md mb-3">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <CategoryBadge category={article.category} size="sm" />
        <h3 className="font-serif font-bold text-lg mt-2 line-clamp-2 group-hover:text-destructive transition-colors">
          {article.title}
        </h3>
        {showExcerpt && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{article.author.name}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </Link>
    </article>
  );
};
