import Head from 'next/head';
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  absoluteUrl,
  JsonLd,
} from '@/lib/site';

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  type?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: JsonLd[];
}

const OG_IMAGE = '/images/hero-illustration.png';

export function Seo({
  title,
  description = SITE_DESCRIPTION,
  path = '/',
  type = 'website',
  image = OG_IMAGE,
  noindex = false,
  jsonLd = [],
}: SeoProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@Arnaud_Kennedy" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block),
          }}
        />
      ))}
    </Head>
  );
}

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    foundingDate: '2024',
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
  };
}

export function softwareApplicationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '@kuberna/sdk',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: 'https://www.npmjs.com/package/@kuberna/sdk',
    description: 'TypeScript SDK for building, deploying, and monetizing autonomous AI agents on decentralized networks.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}