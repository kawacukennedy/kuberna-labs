import dynamic from 'next/dynamic';
import { CoursesSkeleton } from '@/components/courses/CoursesSkeleton';

export default dynamic(() => import('./_page'), {
  loading: () => <CoursesSkeleton />,
});
