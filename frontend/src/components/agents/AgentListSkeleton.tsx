import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/Skeleton';

function AgentCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 min-h-[280px]">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mb-3 h-6 w-3/4" />
      <Skeleton className="mb-5 h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div>
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-outline/10">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AgentListSkeleton() {
  return (
    <Layout variant="dashboard">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="mb-3 h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((item) => (
            <AgentCardSkeleton key={item} />
          ))}
          <div className="border-2 border-dashed border-outline/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 min-h-[280px]">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
