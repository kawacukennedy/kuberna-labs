# Kuberna Labs Frontend - Vercel Deployment

This document covers deploying the Kuberna Labs frontend to Vercel.

## Quick Start

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kuberna-labs/kuberna-labs)

### Option 2: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd frontend

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

Before deploying, set the following environment variables in your Vercel project:

### Required

| Variable                               | Description              | Example                                                         |
| -------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                  | Backend API URL          | `https://api.kuberna.africa`                                    |
| `NEXT_PUBLIC_GRAPHQL_URL`              | GraphQL endpoint URL     | `https://api.kuberna.africa/graphql`                            |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Get from [WalletConnect Cloud](https://cloud.walletconnect.com) |

### Optional

| Variable                       | Description           | Default                   |
| ------------------------------ | --------------------- | ------------------------- |
| `NEXT_PUBLIC_ETH_RPC_URL`      | Ethereum RPC URL      | Public RPC                |
| `NEXT_PUBLIC_POLYGON_RPC_URL`  | Polygon RPC URL       | Public RPC                |
| `NEXT_PUBLIC_ARBITRUM_RPC_URL` | Arbitrum RPC URL      | Public RPC                |
| `NEXT_PUBLIC_NEAR_RPC_URL`     | NEAR RPC URL          | Public RPC                |
| `NEXT_PUBLIC_POSTHOG_KEY`      | PostHog analytics key | -                         |
| `NEXT_PUBLIC_POSTHOG_HOST`     | PostHog host URL      | `https://app.posthog.com` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics      | `false`                   |
| `NEXT_PUBLIC_APP_URL`          | Application URL       | `https://kuberna.africa`  |

## Vercel Project Settings

### Framework Preset

Select **Next.js** as the framework preset.

### Build Command

```bash
npm run build
```

### Development Command

```bash
npm run dev
```

### Install Command

```bash
npm install
```

### Output Directory

Leave empty (Next.js default).

### Root Directory

```bash
frontend
```

### Regions

Recommended: `Washington D.C. (iad1)` for lowest latency to backend services.

## Deployment Configuration

The project includes a `vercel.json` configuration file with:

- Security headers
- API routing to backend
- Image optimization domains
- Redirect rules

### Custom vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"]
}
```

## GitHub Integration

The project includes GitHub Actions workflows for automated deployment:

### Preview Deployments

Automatically deploys on every pull request to the `develop` branch.

### Production Deployments

Automatically deploys on every tag starting with `v` (e.g., `v1.0.0`).

### Required GitHub Secrets

Add these secrets to your GitHub repository:

| Secret                                 | Description              |
| -------------------------------------- | ------------------------ |
| `VERCEL_TOKEN`                         | Vercel API token         |
| `NEXT_PUBLIC_API_URL`                  | Production API URL       |
| `NEXT_PUBLIC_GRAPHQL_URL`              | Production GraphQL URL   |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |

### Getting a Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token
5. Add it to GitHub Secrets as `VERCEL_TOKEN`

## Domains

### Production

- Primary: `kuberna.africa`
- Add custom domain in Vercel Dashboard → Settings → Domains

### Staging

- Preview deployments available at: `{project}-{git-branch}.vercel.app`

## Performance Optimization

The frontend is configured for optimal performance on Vercel:

- **Edge Caching**: Static assets cached at the edge
- **Image Optimization**: Next.js Image component with automatic WebP conversion
- **Code Splitting**: Automatic route-based code splitting
- **Prefetching**: Links prefetch data for faster navigation
- **ISR**: Incremental Static Regeneration for dynamic pages (if needed)

## Troubleshooting

### Build Fails

1. Check environment variables are set correctly
2. Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is valid
3. Ensure all dependencies install successfully

### Runtime Errors

1. Check browser console for errors
2. Verify API URL is correct and accessible
3. Check Network tab for failed requests

### WalletConnect Not Working

1. Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
2. Check [WalletConnect Dashboard](https://cloud.walletconnect.com) for project status
3. Ensure the project domain is whitelisted

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in the dashboard for real-time performance insights.

### Error Tracking

Consider integrating Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx sentry-wizard -i nextjs
```

## Support

- Discord: https://discord.gg/kuberna
- Email: support@kuberna.africa
- Documentation: https://docs.kuberna.africa
