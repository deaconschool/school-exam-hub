import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminDashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white border border-gray-200 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management Actions Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-white border border-gray-200 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Status Skeleton */}
      <Card className="bg-white border border-gray-200 rounded-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const StudentListSkeleton = () => (
  <div className="space-y-6">
    {/* Search and Filters Skeleton */}
    <Card className="bg-white border border-gray-200 rounded-lg">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="lg:col-span-2 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>

    {/* Table Skeleton */}
    <Card className="bg-white border border-gray-200 rounded-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Name', 'Stage', 'Class', 'Level', 'Status', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="border-b border-gray-100">
                  {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                    <td key={cell} className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Pagination Skeleton */}
    <Card className="bg-white border border-gray-200 rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-1">
              {[1, 2, 3].map((page) => (
                <Skeleton key={page} className="h-8 w-8" />
              ))}
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const CardSkeleton = ({ count = 1 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="bg-white border border-gray-200 rounded-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const TableSkeleton = ({
  rows = 5,
  columns = 5,
  headerHeight = 'h-12',
  rowHeight = 'h-16'
}: {
  rows?: number;
  columns?: number;
  headerHeight?: string;
  rowHeight?: string;
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-200">
    <div className={`bg-gray-50 border-b border-gray-200 ${headerHeight}`}>
      <div className="flex">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 px-6 py-3">
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className={`flex ${rowHeight}`}>
          {Array.from({ length: columns }).map((_, col) => (
            <div key={col} className="flex-1 px-6 py-4">
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const PageLoader = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    default: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export const FormSkeleton = ({ fieldCount = 5 }: { fieldCount?: number }) => (
  <div className="space-y-6">
    {Array.from({ length: fieldCount }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-16" />
    </div>
  </div>
);

// Empty states with better UX
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-12">
    <div className="p-6 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
    {action}
  </div>
);

export const ErrorState = ({
  title = 'Something went wrong',
  description,
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <div className="text-center py-12">
    <div className="p-6 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
      <div className="w-8 h-8 text-red-600">⚠️</div>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      {description || 'An error occurred while loading this content. Please try again.'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Try Again
      </button>
    )}
  </div>
);