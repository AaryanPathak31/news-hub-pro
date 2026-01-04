import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Article } from '@/types/news';

interface BreakingNewsTickerProps {
  articles: Article[];
}

export const BreakingNewsTicker = ({ articles }: BreakingNewsTickerProps) => {
  if (articles.length === 0) return null;

  return (
    <div className="bg-destructive text-destructive-foreground py-2 overflow-hidden" role="alert">
      <div className="container flex items-center gap-4">
        <div className="flex-shrink-0 flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span>Breaking</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 animate-marquee">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/${article.category}/${article.slug}`}
                className="flex-shrink-0 text-sm hover:underline whitespace-nowrap"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
