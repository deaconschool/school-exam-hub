import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${className}`}
    />
  );
};

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%` // Random width between 60-100%
          }}
        />
      ))}
    </div>
  );
};

interface SearchLoadingProps {
  isSearching: boolean;
  children: React.ReactNode;
}

export const SearchLoadingWrapper: React.FC<SearchLoadingProps> = ({
  isSearching,
  children
}) => {
  return (
    <div className="relative">
      {isSearching && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg z-10">
          <div className="flex items-center gap-2 text-blue-600">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Searching...</span>
          </div>
        </div>
      )}
      <div className={isSearching ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};

interface GradeLoadingProps {
  isSaving: boolean;
  children: React.ReactNode;
}

export const GradeLoadingWrapper: React.FC<GradeLoadingProps> = ({
  isSaving,
  children
}) => {
  return (
    <div className="relative">
      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded z-10">
          <div className="flex flex-col items-center gap-2 text-green-600">
            <LoadingSpinner size="md" />
            <span className="text-sm font-medium">Saving grades...</span>
          </div>
        </div>
      )}
      <div className={isSaving ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};

interface BatchOperationLoadingProps {
  isProcessing: boolean;
  message?: string;
  children: React.ReactNode;
}

export const BatchOperationLoading: React.FC<BatchOperationLoadingProps> = ({
  isProcessing,
  message = 'Processing...',
  children
}) => {
  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10">
          <div className="flex flex-col items-center gap-3 text-blue-600 p-6">
            <LoadingSpinner size="lg" />
            <span className="text-lg font-medium">{message}</span>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Please wait while we process your request. This may take a few moments.
            </p>
          </div>
        </div>
      )}
      <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};