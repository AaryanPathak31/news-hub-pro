export type Category = 
  | 'breaking'
  | 'world'
  | 'politics'
  | 'technology'
  | 'business'
  | 'sports'
  | 'entertainment'
  | 'health';

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: Category;
  tags: string[];
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  views?: number;
}

export interface CategoryInfo {
  slug: Category;
  name: string;
  description: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { slug: 'breaking', name: 'Breaking News', description: 'Latest breaking news and updates', color: 'category-breaking' },
  { slug: 'world', name: 'World', description: 'International news and global affairs', color: 'category-world' },
  { slug: 'politics', name: 'Politics', description: 'Political news and government updates', color: 'category-politics' },
  { slug: 'technology', name: 'Technology', description: 'Tech news, gadgets, and innovation', color: 'category-technology' },
  { slug: 'business', name: 'Business', description: 'Business news and market updates', color: 'category-business' },
  { slug: 'sports', name: 'Sports', description: 'Sports news and live scores', color: 'category-sports' },
  { slug: 'entertainment', name: 'Entertainment', description: 'Celebrity news and pop culture', color: 'category-entertainment' },
  { slug: 'health', name: 'Health', description: 'Health news and wellness tips', color: 'category-health' },
];

export const getCategoryInfo = (category: Category): CategoryInfo => {
  return CATEGORIES.find(c => c.slug === category) || CATEGORIES[0];
};
