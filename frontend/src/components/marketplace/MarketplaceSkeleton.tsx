import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/Skeleton';

function IntentCardSkeleton() {
  return (
    <div className="glass glass-card flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex-grow">
        <Skeleton className="mb-3 h-7 w-full" />
        <Skeleton className="mb-6 h-7 w-4/5" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 py-5 border-y border-glass-border">
        <div>
          <Skeleton className="mb-2 h-3 w-28" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-col items-end">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function MarketplaceSkeleton() {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-16 px-6 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="mx-auto mb-6 h-8 w-48 rounded-full" />
          <Skeleton className="mx-auto mb-6 h-14 w-80 max-w-full" />
          <Skeleton className="mx-auto mb-3 h-6 w-full max-w-2xl" />
          <Skeleton className="mx-auto h-6 w-5/6 max-w-xl" />
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Skeleton className="h-14 w-full rounded-xl sm:w-56" />
            <Skeleton className="h-14 w-full rounded-xl sm:w-44" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <Skeleton className="h-12 flex-grow rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-28 rounded-xl" />
          </div>
        </div>

        <div className="flex border-b border-outline/10 mb-12 gap-10 overflow-x-auto">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="mb-4 h-4 w-28 flex-shrink-0" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <IntentCardSkeleton key={item} />
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <Skeleton className="h-14 w-56 rounded-xl" />
        </div>
      </div>
    </Layout>
  );
}
