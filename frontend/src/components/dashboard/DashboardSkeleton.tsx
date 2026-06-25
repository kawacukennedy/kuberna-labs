import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="glass p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="mb-2 h-9 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 h-full">
      <Skeleton className="mb-4 h-48 w-full rounded-lg" />
      <Skeleton className="mb-2 h-6 w-5/6" />
      <Skeleton className="mb-6 h-4 w-1/2" />
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

function ActiveAgentRowSkeleton() {
  return (
    <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div>
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Layout variant="dashboard">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <Skeleton className="mb-3 h-10 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>

        <DashboardStatsSkeleton />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CourseCardSkeleton />
                <CourseCardSkeleton />
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-4">
                <ActiveAgentRowSkeleton />
                <ActiveAgentRowSkeleton />
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-surface-container-low p-6 rounded-xl">
              <Skeleton className="mb-4 h-6 w-36" />
              <Skeleton className="mb-3 h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </section>

            <section className="bg-surface-container-low p-6 rounded-xl">
              <Skeleton className="mb-6 h-7 w-40" />
              <div className="space-y-6">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex gap-4">
                    <Skeleton className="mt-1 h-8 w-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-primary text-white p-6 rounded-xl">
              <Skeleton className="mb-4 h-7 w-44 bg-white/30" />
              <Skeleton className="mb-3 h-4 w-full bg-white/30" />
              <Skeleton className="mb-6 h-4 w-5/6 bg-white/30" />
              <Skeleton className="h-11 w-full rounded-xl bg-white/40" />
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
