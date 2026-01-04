import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { Article } from '@/types/news';
import { formatDistanceToNow } from 'date-fns';

interface TrendingSidebarProps {
  articles: Article[];
  title?: string;
}

export const TrendingSidebar = ({ articles, title = 'Trending Now' }: TrendingSidebarProps) => {
  return (
    <aside className="bg-secondary rounded-lg p-4" aria-label="Trending articles">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <TrendingUp className="h-5 w-5 text-destructive" />
        <h2 className="font-serif font-bold text-lg">{title}</h2>
      </div>
      <ol className="space-y-4">
        {articles.map((article, index) => (
          <li key={article.id} className="group">
            <Link to={`/${article.category}/${article.slug}`} className="flex gap-3">
              <span className="flex-shrink-0 text-2xl font-serif font-bold text-muted-foreground/50 group-hover:text-destructive transition-colors">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-destructive transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
};
