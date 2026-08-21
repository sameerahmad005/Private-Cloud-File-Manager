import React from 'react';

interface SkeletonLoaderProps {
  viewMode: 'grid' | 'list';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ viewMode, count = 8 }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 animate-pulse space-y-3"
          >
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="space-y-1.5 pt-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 space-x-4">
          <div className="flex items-center space-x-3 w-1/2">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/6 hidden sm:block"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/6 hidden md:block"></div>
        </div>
      ))}
    </div>
  );
};
