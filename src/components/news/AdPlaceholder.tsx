import { cn } from '@/lib/utils';

interface AdPlaceholderProps {
  variant: 'banner' | 'sidebar' | 'inline' | 'leaderboard';
  className?: string;
}

const adSizes = {
  banner: 'h-24 md:h-28',
  sidebar: 'h-64',
  inline: 'h-20',
  leaderboard: 'h-16 md:h-24',
};

export const AdPlaceholder = ({ variant, className }: AdPlaceholderProps) => {
  return (
    <div
      className={cn(
        'ad-placeholder rounded-md',
        adSizes[variant],
        className
      )}
      role="complementary"
      aria-label="Advertisement"
    >
      <span className="text-muted-foreground">Advertisement</span>
    </div>
  );
};
