import { Helmet } from 'react-helmet-async';
import { SEOData } from '@/lib/seo';

interface SEOHeadProps {
  seo: SEOData;
  structuredData?: object | object[];
}

export const SEOHead = ({ seo, structuredData }: SEOHeadProps) => {
  const structuredDataArray = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seo.title}</title>
      <meta name="title" content={seo.title} />
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}
      <link rel="canonical" href={seo.canonical} />
      
      {/* Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Google News specific */}
      {seo.keywords && <meta name="news_keywords" content={seo.keywords} />}
      <meta name="googlebot-news" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={seo.openGraph.type} />
      <meta property="og:url" content={seo.openGraph.url} />
      <meta property="og:title" content={seo.openGraph.title} />
      <meta property="og:description" content={seo.openGraph.description} />
      <meta property="og:site_name" content={seo.openGraph.siteName} />
      <meta property="og:locale" content={seo.openGraph.locale} />
      {seo.openGraph.image && (
        <>
          <meta property="og:image" content={seo.openGraph.image} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={seo.openGraph.title} />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content={seo.twitter.card} />
      <meta name="twitter:url" content={seo.openGraph.url} />
      <meta name="twitter:title" content={seo.twitter.title} />
      <meta name="twitter:description" content={seo.twitter.description} />
      {seo.twitter.image && <meta name="twitter:image" content={seo.twitter.image} />}
      {seo.twitter.site && <meta name="twitter:site" content={seo.twitter.site} />}
      {seo.twitter.creator && <meta name="twitter:creator" content={seo.twitter.creator} />}

      {/* Article-specific meta tags */}
      {seo.article?.publishedTime && (
        <meta property="article:published_time" content={seo.article.publishedTime} />
      )}
      {seo.article?.modifiedTime && (
        <meta property="article:modified_time" content={seo.article.modifiedTime} />
      )}
      {seo.article?.author && (
        <meta property="article:author" content={seo.article.author} />
      )}
      {seo.article?.section && (
        <meta property="article:section" content={seo.article.section} />
      )}
      {seo.article?.tags?.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Structured Data */}
      {structuredDataArray.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};
