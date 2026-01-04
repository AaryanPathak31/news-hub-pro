import { Article, CategoryInfo } from '@/types/news';

export interface SEOData {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
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
    site?: string;
    creator?: string;
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
const TWITTER_HANDLE = '@nonamenews';

export const generateArticleSEO = (article: Article): SEOData => {
  // SEO-optimized title (max 60 chars)
  const title = article.title.length > 60 
    ? `${article.title.substring(0, 57)}...` 
    : article.title;
  
  // Meta description (max 160 chars)
  const description = article.excerpt.length > 160 
    ? `${article.excerpt.substring(0, 157)}...` 
    : article.excerpt;

  const url = `${SITE_URL}/${article.category}/${article.slug}`;
  
  // Generate keywords from tags
  const keywords = article.tags.join(', ');

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: url,
    keywords,
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
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
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
  const title = `${category.name} News - Latest Updates & Headlines`;
  const description = `Get the latest ${category.name.toLowerCase()} news, breaking stories, and in-depth coverage. Stay informed with NoNameNews.`;
  const url = `${SITE_URL}/${category.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: url,
    keywords: `${category.name} news, ${category.name} updates, latest ${category.name}, breaking ${category.name} news`,
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
      site: TWITTER_HANDLE,
    },
  };
};

export const generateHomeSEO = (): SEOData => {
  const title = 'NoNameNews - Breaking News, India News & World Updates';
  const description = 'Get the latest breaking news, India news, world news, politics, technology, business, sports, entertainment, and health news. Stay informed with NoNameNews.';
  const url = SITE_URL;

  return {
    title,
    description,
    canonical: url,
    keywords: 'breaking news, India news, world news, latest news, politics, technology, business, sports, entertainment, health news',
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
      site: TWITTER_HANDLE,
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
    image: {
      '@type': 'ImageObject',
      url: article.featuredImage,
      width: 1200,
      height: 630,
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: `${SITE_URL}/author/${article.author.id}`,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    wordCount: article.content.split(' ').length,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
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
    description: 'Breaking news, India news, and world updates',
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
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
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 600,
      height: 60,
    },
    description: 'Your trusted source for breaking news, India news, and world updates',
    sameAs: [
      'https://twitter.com/nonamenews',
      'https://facebook.com/nonamenews',
      'https://linkedin.com/company/nonamenews',
      'https://instagram.com/nonamenews',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@nonamenews.com',
    },
    foundingDate: '2024',
    ethicsPolicy: `${SITE_URL}/ethics`,
    masthead: `${SITE_URL}/about`,
    missionCoveragePrioritiesPolicy: `${SITE_URL}/coverage`,
  };
};

// Generate FAQ schema for articles with Q&A content
export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

// Generate Video schema if article has video content
export const generateVideoSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
  };
};
