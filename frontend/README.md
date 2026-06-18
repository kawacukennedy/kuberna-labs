# Kuberna Labs Frontend

Next.js 14 dashboard for the Kuberna Labs platform. Pages router with Server-Side Rendering and static export support.

## Tech Stack

| Component | Library |
|-----------|---------|
| Framework | Next.js 14 (pages router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3.x |
| Animations | Framer Motion 11.x |
| Icons | Lucide React |
| Web3 | wagmi 2.x + viem 2.x |
| Data Fetching | TanStack React Query 5.x |
| HTTP | Axios |
| Auth | AuthContext (JWT-based) |
| Testing | Jest + React Testing Library |

## Design System

- **Typography**: Space Grotesk (headings), Inter (body)
- **Primary**: Indigo (#6366F1)
- **Secondary**: Emerald (#10B981)
- **Aesthetic**: Glassmorphism, depth, dynamic interactions

## Getting Started

```bash
# Install dependencies
cd frontend && npm install

# Start dev server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/               # Application routes (pages router)
│   │   ├── index.tsx        # Landing page
│   │   ├── _app.tsx         # App wrapper (providers, layout)
│   │   ├── _document.tsx    # Custom document
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── agents/          # Agent management pages
│   │   ├── auth/            # Login/register pages
│   │   ├── courses/         # Course catalog pages
│   │   ├── learn/           # Learning content pages
│   │   ├── marketplace/     # Intent marketplace pages
│   │   ├── admin/           # Admin panel pages
│   │   ├── about.tsx        # About page
│   │   ├── blog.tsx         # Blog page
│   │   ├── docs.tsx         # Documentation page
│   │   └── ...              # Support, privacy, contact, careers
│   ├── components/
│   │   ├── ui/              # Primitive UI components
│   │   ├── layout/          # Layout shell (header, sidebar, footer)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── marketplace/     # Marketplace components
│   │   ├── shared/          # Shared application components
│   │   ├── Wallet/          # Web3 wallet connection components
│   │   └── AIAssistant.tsx  # AI-powered agent creation wizard
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication state provider
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # wagmi config, contract config, chains
│   ├── services/             # Contract interaction services
│   ├── styles/               # Global styles, Tailwind config
│   └── types/                # Shared TypeScript types
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind theme configuration
├── jest.config.js            # Jest configuration
└── tsconfig.json             # TypeScript configuration
```

## Pages

| Path | Description |
|------|-------------|
| `/` | Public landing page |
| `/dashboard` | Main dashboard after login |
| `/agents` | AI agent management (create, deploy, monitor) |
| `/agents/[id]` | Single agent detail and trace view |
| `/marketplace` | Intent marketplace for agents |
| `/courses` | Course catalog |
| `/learn/[id]` | Course content viewer |
| `/auth/login` | Login page |
| `/auth/register` | Registration page |
| `/profile` | User profile settings |
| `/admin` | Admin panel (feature flags, api keys) |
| `/about`, `/blog`, `/docs` | Content pages |
| `/support`, `/contact` | Support pages |
| `/careers`, `/enterprise` | Business pages |
| `/privacy` | Privacy policy |

## Component Architecture

Components follow a layered hierarchy:

1. **`ui/`** — Primitive components: buttons, inputs, cards, modals, badges, toasts
2. **`layout/`** — App shell: `Navbar`, `Sidebar`, `Footer`, `PageContainer`
3. **`shared/`** — Domain-agnostic: data tables, search bars, loading states, error boundaries
4. **`dashboard/`** — Dashboard widgets: stats cards, activity feeds, charts
5. **`marketplace/`** — Intent cards, bid panels, filters
6. **`Wallet/`** — Wallet connection button, account display, network switcher

## State Management

| Concern | Approach |
|---------|----------|
| Server state | TanStack React Query (caching, refetching, mutations) |
| Authentication | AuthContext (JWT token + user profile in React context) |
| Wallet connection | wagmi hooks (`useAccount`, `useConnect`, `useWalletClient`) |
| Form state | Local React state or controlled components |
| UI state | Local component state |

### AuthContext

The `AuthContext` in `src/context/AuthContext.tsx` provides:

- `user` — Current user profile
- `token` — JWT access token (stored in localStorage)
- `login(token, user)` — Set auth state
- `logout()` — Clear auth state and redirect
- `isLoading` — Initial auth check state

### React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';

// Fetch agents
const { data: agents, isLoading } = useQuery({
  queryKey: ['agents'],
  queryFn: () => api.get('/api/agents').then(r => r.data),
});

// Create agent
const mutation = useMutation({
  mutationFn: (agent) => api.post('/api/agents', agent),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
});
```

## Web3 Integration

Wallet connection via wagmi v2 with support for:

- WalletConnect v2
- Injected wallets (MetaMask, Rainbow, etc.)
- Base Sepolia and other EVM chains

Contract interactions use viem for type-safe calls with ABI-generated hooks.

## Styling

- Utility-first CSS via Tailwind CSS with custom theme
- Glassmorphism effects using `backdrop-blur` and semi-transparent backgrounds
- Framer Motion for page transitions and micro-interactions
- Responsive design with mobile-first breakpoints

## Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

Tests use Jest with React Testing Library for component tests. Mock network requests and wallet connections in test setup.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 3001) |
| `npm run build` | Production build (static export) |
| `npm start` | Start production server |
| `npm run lint` | ESLint via Next.js |
| `npm test` | Run Jest tests |

## Related

- [Backend README](../backend/README.md)
- [SDK README](../sdk/README.md)
- [Contracts README](../contracts/README.md)
- [Root README](../README.md)
