import dynamic from 'next/dynamic';
import { AgentListSkeleton } from '@/components/agents/AgentListSkeleton';

export default dynamic(() => import('./_page'), {
  loading: () => <AgentListSkeleton />,
});