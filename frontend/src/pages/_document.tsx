import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="description" content="Kuberna Labs — Architecting the Agentic Web3 Enterprise. Build, deploy, and monetize autonomous AI agents on decentralized infrastructure." />
        <meta name="theme-color" content="#6366F1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* Open Graph defaults (pages refine via <Seo/>) */}
        <meta property="og:site_name" content="Kuberna Labs" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Arnaud_Kennedy" />
        <meta name="twitter:creator" content="@Arnaud_Kennedy" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#6366F1" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0B0D14" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}