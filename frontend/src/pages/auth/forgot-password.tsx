import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/PageLoader';

export default dynamic(() => import('./_forgot-password'), {
  loading: () => <PageLoader />,
});
