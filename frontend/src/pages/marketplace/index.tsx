import dynamic from 'next/dynamic';
import { MarketplaceSkeleton } from '@/components/marketplace/MarketplaceSkeleton';

export default dynamic(() => import('./_page'), {
  loading: () => <MarketplaceSkeleton />,
});
