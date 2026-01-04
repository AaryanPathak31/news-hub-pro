import { Link } from 'react-router-dom';
import { Category, getCategoryInfo } from '@/types/news';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryBadge = ({ category, size = 'sm', className }: CategoryBadgeProps) => {
  const categoryInfo = getCategoryInfo(category);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Link
      to={`/${category}`}
      className={cn(
        'inline-block font-semibold uppercase tracking-wide rounded-sm transition-opacity hover:opacity-80',
        categoryInfo.color,
        sizeClasses[size],
        className
      )}
    >
      {categoryInfo.name}
    </Link>
  );
};
