import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/Skeleton';

function CourseCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col h-full">
      <Skeleton className="mb-4 h-48 w-full rounded-lg" />
      <Skeleton className="mb-2 h-6 w-5/6" />
      <Skeleton className="mb-6 h-4 w-1/2" />
      <div className="flex items-center gap-4 mb-4 mt-auto">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center justify-between mt-auto">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

export function CoursesSkeleton() {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-16 px-6 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="mx-auto mb-6 h-8 w-48 rounded-full" />
          <Skeleton className="mx-auto mb-6 h-14 w-80 max-w-full" />
          <Skeleton className="mx-auto mb-3 h-6 w-full max-w-2xl" />
          <Skeleton className="mx-auto h-6 w-5/6 max-w-xl" />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-10 w-28 flex-shrink-0 rounded-lg" />
            ))}
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            <Skeleton className="h-12 flex-grow rounded-lg lg:w-80" />
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <CourseCardSkeleton key={item} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
