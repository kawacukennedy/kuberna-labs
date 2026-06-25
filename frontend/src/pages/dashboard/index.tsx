import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default dynamic(() => import('./_page'), {
  loading: () => <DashboardSkeleton />,
});
