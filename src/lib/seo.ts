import { Article, CategoryInfo } from '@/types/news';

export interface SEOData {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
    siteName: string;
    locale: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image?: string;
  };
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

const SITE_NAME = 'NoNameNews';
const SITE_URL = 'https://nonamenews.com';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop';

export const generateArticleSEO = (article: Article): SEOData => {
  const title = article.title.length > 60 
    ? `${article.title.substring(0, 57)}...` 
    : article.title;
  
  const description = article.excerpt.length > 160 
    ? `${article.excerpt.substring(0, 157)}...` 
    : article.excerpt;

  const url = `${SITE_URL}/${article.category}/${article.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      image: article.featuredImage,
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: article.featuredImage,
    },
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      author: article.author.name,
      section: article.category,
      tags: article.tags,
    },
  };
};

export const generateCategorySEO = (category: CategoryInfo): SEOData => {
  const title = `${category.name} News`;
  const description = category.description;
  const url = `${SITE_URL}/${category.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      image: DEFAULT_IMAGE,
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: DEFAULT_IMAGE,
    },
  };
};

export const generateHomeSEO = (): SEOData => {
  const title = 'NoNameNews - Breaking News, World News & Latest Updates';
  const description = 'Get the latest breaking news, world news, politics, technology, business, sports, entertainment, and health news from NoNameNews.';
  const url = SITE_URL;

  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      image: DEFAULT_IMAGE,
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: DEFAULT_IMAGE,
    },
  };
};

export const generateNewsArticleSchema = (article: Article) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/${article.category}/${article.slug}`,
    },
    headline: article.title,
    description: article.excerpt,
    image: [article.featuredImage],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
  };
};

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
};

export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/nonamenews',
      'https://facebook.com/nonamenews',
      'https://linkedin.com/company/nonamenews',
    ],
  };
};
