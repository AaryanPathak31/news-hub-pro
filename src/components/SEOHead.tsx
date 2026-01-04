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
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={seo.canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={seo.openGraph.title} />
      <meta property="og:description" content={seo.openGraph.description} />
      <meta property="og:type" content={seo.openGraph.type} />
      <meta property="og:url" content={seo.openGraph.url} />
      <meta property="og:site_name" content={seo.openGraph.siteName} />
      <meta property="og:locale" content={seo.openGraph.locale} />
      {seo.openGraph.image && <meta property="og:image" content={seo.openGraph.image} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={seo.twitter.card} />
      <meta name="twitter:title" content={seo.twitter.title} />
      <meta name="twitter:description" content={seo.twitter.description} />
      {seo.twitter.image && <meta name="twitter:image" content={seo.twitter.image} />}

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
