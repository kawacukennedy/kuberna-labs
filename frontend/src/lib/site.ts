export const SITE_URL = 'https://kuberna-labs.onrender.com';

export const SITE_NAME = 'Kuberna Labs';

export const SITE_TAGLINE = 'The Full-Stack Platform for Agentic Web3';

export const SITE_DESCRIPTION =
  'Build, deploy, certify, and monetize autonomous AI agents that execute real work across decentralized networks. x402 payments, TEE deployment, conformance-tested SDK.';

export const SITE_AUTHOR = 'Kuberna Labs';

export interface JsonLd {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export function absoluteUrl(path = '/'): string {
  const base = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const isFile = /\.[a-z0-9]+$/i.test(base);
  return !isFile && base.length > `${SITE_URL}/`.length && !base.endsWith('/') ? `${base}/` : base;
}