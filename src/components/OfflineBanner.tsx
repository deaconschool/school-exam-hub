import React, { useState, useEffect } from 'react';
import { connectivityService } from '../services/connectivityService';
import { useLanguage } from '@/contexts/LanguageContext';

interface OfflineBannerProps {
  className?: string;
  showSyncProgress?: boolean;
  syncProgress?: {
    pending: number;
    syncing: number;
    completed: number;
    failed: number;
  };
  onManualSync?: () => void;
  onRetryConnection?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  className = '',
  showSyncProgress = false,
  syncProgress,
  onManualSync,
  onRetryConnection
}) => {
  const [connectivityStatus, setConnectivityStatus] = useState({
    online: navigator.onLine,
    quality: navigator.onLine ? 'good' as const : 'offline',
    lastConnected: navigator.onLine ? new Date() : null,
    nextRetry: null as Date | null,
    retryCount: 0,
    maxRetries: 5,
    connectionType: 'unknown' as string
  });

  const { language } = useLanguage();
  const isRTL = language === 'ar';

  useEffect(() => {
    // Get initial status
    const status = connectivityService.getStatus();
    setConnectivityStatus(status);

    // Subscribe to updates
    const unsubscribe = connectivityService.subscribe((newStatus) => {
      setConnectivityStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const {
    online: isOnline,
    quality,
    lastConnected,
    nextRetry,
    retryCount,
    maxRetries
  } = connectivityStatus;

  const isOffline = !isOnline;
  const isConnectedPoor = isOnline && quality === 'poor';
  const isConnectedGood = isOnline && quality === 'good';
  const isConnectedExcellent = isOnline && quality === 'excellent';
  const canRetry = retryCount < maxRetries;
  const retryIn = nextRetry ? Math.max(0, Math.ceil((nextRetry.getTime() - Date.now()) / 1000)) : 0;

  // Don't show banner when everything is excellent
  if (isConnectedExcellent && !showSyncProgress) {
    return null;
  }

  const getBannerType = () => {
    if (isOffline) return 'offline';
    if (isConnectedPoor) return 'poor';
    if (showSyncProgress && syncProgress?.pending) return 'sync';
    return 'warning';
  };

  const getBannerStyles = () => {
    const baseStyles = `
      w-full px-4 py-3 text-sm font-medium
      transition-all duration-300 ease-in-out
      flex items-center justify-between
      ${isRTL ? 'text-right' : 'text-left'}
    `;

    switch (getBannerType()) {
      case 'offline':
        return `${baseStyles} bg-red-50 border-b border-red-200 text-red-800`;
      case 'poor':
        return `${baseStyles} bg-yellow-50 border-b border-yellow-200 text-yellow-800`;
      case 'sync':
        return `${baseStyles} bg-blue-50 border-b border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-orange-50 border-b border-orange-200 text-orange-800`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";

    switch (getBannerType()) {
      case 'offline':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'poor':
        return (
          <svg className={`${iconClass} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'sync':
        return (
          <svg className={`${iconClass} text-blue-600 animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-orange-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getMessage = () => {
    switch (getBannerType()) {
      case 'offline':
        return language === 'ar' ? 'أنت غير متصل حالياً. سيتم حفظ الدرجات محلياً ومزامنتها عند استعادة الاتصال.' : 'You are currently offline. Grades will be saved locally and synced when connection is restored.';
      case 'poor':
        return language === 'ar' ? 'تم الكشف عن اتصال ضعيف. قد تتأخر عمليات الحفظ.' : 'Poor connection detected. Save operations may be delayed.';
      case 'sync':
        return language === 'ar' ? 'جاري مزامنة الدرجات المحفوظة مع الخادم...' : 'Syncing saved grades to server...';
      default:
        return language === 'ar' ? 'تم الكشف عن اتصال بطيء. قد تتأخر بعض الميزات.' : 'Slow connection detected. Some features may be delayed.';
    }
  };

  const getSecondaryInfo = () => {
    if (isOffline && lastConnected) {
      const timeDiff = Date.now() - lastConnected.getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const timeAgo = minutes === 0 ? (language === 'ar' ? 'الآن' : 'just now') :
                     minutes === 1 ? (language === 'ar' ? 'منذ دقيقة واحدة' : '1 minute ago') :
                     (language === 'ar' ? `منذ ${minutes} دقائق` : `${minutes} minutes ago`);

      return language === 'ar' ? `آخر اتصال: ${timeAgo}` : `Last connected: ${timeAgo}`;
    }

    if (isOffline && nextRetry && canRetry) {
      return language === 'ar' ? `إعادة المحاولة خلال ${retryIn} ثانية...` : `Retrying in ${retryIn} seconds...`;
    }

    if (showSyncProgress && syncProgress) {
      const { pending, syncing, completed, failed } = syncProgress;
      if (pending > 0 || syncing > 0) {
        return language === 'ar'
          ? `${pending} في الانتظار، ${syncing} جاري المزامنة، ${completed} مكتمل، ${failed} فشل`
          : `${pending} pending, ${syncing} syncing, ${completed} completed, ${failed} failed`;
      }
    }

    if (isConnectedPoor) {
      return language === 'ar' ? `نوع الاتصال: ${quality}` : `Connection type: ${quality}`;
    }

    return null;
  };

  const getActions = () => {
    const actions = [];

    if (isOffline && onRetryConnection && canRetry) {
      actions.push(
        <button
          key="retry"
          onClick={onRetryConnection}
          className={`px-3 py-1 text-xs font-medium rounded ${
            isRTL
              ? 'mr-2 bg-red-100 text-red-800 hover:bg-red-200'
              : 'ml-2 bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {language === 'ar' ? 'إعادة المحاولة الآن' : 'Retry Now'}
        </button>
      );
    }

    if (showSyncProgress && onManualSync && syncProgress?.pending) {
      actions.push(
        <button
          key="manual-sync"
          onClick={onManualSync}
          className={`px-3 py-1 text-xs font-medium rounded ${
            isRTL
              ? 'mr-2 bg-blue-100 text-blue-800 hover:bg-blue-200'
              : 'ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
        >
          {language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}
        </button>
      );
    }

    return actions.length > 0 ? <div className="flex items-center">{actions}</div> : null;
  };

  const bannerContent = (
    <>
      {/* Left side - Icon and message */}
      <div className="flex items-center flex-1 min-w-0">
        {getIcon()}
        <div className={`${isRTL ? 'mr-3' : 'ml-3'} min-w-0 flex-1`}>
          <div className="font-medium">{getMessage()}</div>
          {getSecondaryInfo() && (
            <div className="text-xs opacity-75 mt-1">{getSecondaryInfo()}</div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      {getActions()}
    </>
  );

  return (
    <div className={`${getBannerStyles()} ${className}`} role="alert">
      {bannerContent}
    </div>
  );
};

// Additional helper components for different contexts
export const CompactOfflineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOffline, isConnectedPoor } = useConnectivity();

  if (!isOffline && !isConnectedPoor) return null;

  const indicatorClass = isOffline ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <div className={`relative ${className}`}>
      <div className={`w-3 h-3 ${indicatorClass} rounded-full animate-pulse`} />
    </div>
  );
};

export const ConnectionQualityIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { quality, isOnline } = useConnectivity();

  if (!isOnline) return null;

  const getQualityColor = () => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityIcon = () => {
    const iconClass = `w-4 h-4 ${getQualityColor()}`;

    switch (quality) {
      case 'excellent':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2-2v8a2 2 0 002 2h14a2 2 0 002-2V7l2 2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v4zm11 7a5 5 0 100-10 5 5 0 000 10z"/>
          </svg>
        );
      case 'good':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2-2v8a2 2 0 002 2h6a5 5 0 000-10H3a2 2 0 00-2 2v4zm11 3a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        );
      case 'poor':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2-2v6a2 2 0 002 2h2a3 3 0 100-6H3a2 2 0 00-2 2v4zm7 1a1 1 0 11-2 0 1 1 0 012 0z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getQualityIcon()}
      <span className={`text-xs font-medium capitalize ${getQualityColor()}`}>
        {quality}
      </span>
    </div>
  );
};

export default OfflineBanner;