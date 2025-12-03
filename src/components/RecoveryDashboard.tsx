import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Archive,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  FileText,
  Calendar,
  User,
  Zap
} from 'lucide-react';

// Import the services we need
import { connectivityService, useConnectivity } from '@/services/connectivityService';
import { offlineQueueService, QueuedOperation } from '@/services/offlineQueueService';
import { backupService, BackupRecord } from '@/services/backupService';

interface RecoveryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
}

export const RecoveryDashboard: React.FC<RecoveryDashboardProps> = ({
  isOpen,
  onClose,
  teacherId
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isOnline, isConnectedExcellent, isConnectedGood, isConnectedPoor } = useConnectivity();
  const isRTL = language === 'ar';

  // State for different data views
  const [activeTab, setActiveTab] = useState<'queue' | 'backups' | 'status'>('queue');
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    failed: 0
  });

  // Load data when component opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, teacherId]);

  // Auto-refresh when online status changes
  useEffect(() => {
    if (isOnline) {
      loadData();
    }
  }, [isOnline]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [operations, backupRecords] = await Promise.all([
        offlineQueueService.getPendingOperations(teacherId),
        backupService.getBackupRecords(teacherId)
      ]);

      setQueuedOperations(operations);
      setBackups(backupRecords);
      updateSyncProgress(operations);
    } catch (error) {
      console.error('Failed to load recovery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSyncProgress = (operations: QueuedOperation[]) => {
    const progress = {
      total: operations.length,
      completed: operations.filter(op => op.status === 'completed').length,
      inProgress: operations.filter(op => op.status === 'syncing').length,
      failed: operations.filter(op => op.status === 'failed').length
    };
    setSyncProgress(progress);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert(language === 'ar'
        ? 'يرجى الاتصال بالإنترنت قبل المزامنة'
        : 'Please connect to the internet before syncing');
      return;
    }

    try {
      setIsLoading(true);
      const success = await offlineQueueService.processQueue(teacherId);

      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      alert(language === 'ar'
        ? 'فشلت المزامنة اليدوية'
        : 'Manual sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromBackup = async (backup: BackupRecord) => {
    const confirmMessage = language === 'ar'
      ? `هل أنت متأكد من استعادة البيانات من نسخة احتياطية بتاريخ ${new Date(backup.timestamp).toLocaleString('ar-EG')}؟`
      : `Are you sure you want to restore data from backup dated ${new Date(backup.timestamp).toLocaleString()}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      const success = await backupService.restoreFromBackup(backup.id);

      if (success) {
        alert(language === 'ar'
          ? 'تم استعادة البيانات بنجاح'
          : 'Data restored successfully');
        await loadData();
      } else {
        throw new Error('Restore failed');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert(language === 'ar'
        ? 'فشلت استعادة البيانات'
        : 'Data restoration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    const confirmMessage = language === 'ar'
      ? 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟'
      : 'Are you sure you want to delete this backup?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      await backupService.deleteBackup(backupId);
      await loadData();
    } catch (error) {
      console.error('Delete backup failed:', error);
      alert(language === 'ar'
        ? 'فشل حذف النسخة الاحتياطية'
        : 'Backup deletion failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFailedOperations = async () => {
    const confirmMessage = language === 'ar'
      ? 'هل أنت متأكد من مسح جميع العمليات الفاشلة؟'
      : 'Are you sure you want to clear all failed operations?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      await offlineQueueService.clearFailedOperations(teacherId);
      await loadData();
    } catch (error) {
      console.error('Clear failed operations failed:', error);
      alert(language === 'ar'
        ? 'فشل مسح العمليات الفاشلة'
        : 'Failed to clear failed operations');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationIcon = (operation: QueuedOperation) => {
    switch (operation.type) {
      case 'grade':
      case 'batch_grade':
        return <FileText className="w-4 h-4" />;
      case 'exam_create':
      case 'exam_update':
        return <Database className="w-4 h-4" />;
      case 'student_remove':
        return <User className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'syncing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('مركز التعافي واستعادة البيانات', 'Recovery & Data Restoration Center')}
              </h1>
              <p className="text-blue-100">
                {t('إدارة العمليات المعلقة والنسخ الاحتياطية', 'Manage pending operations and backups')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                </span>
              </div>
              <Button
                onClick={onClose}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                {t('إغلاق', 'Close')}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'queue'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('طابور العمليات', 'Operation Queue')}
              {queuedOperations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {queuedOperations.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'backups'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('النسخ الاحتياطية', 'Backups')}
              {backups.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {backups.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'status'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('حالة النظام', 'System Status')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Queue Operations Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              {/* Sync Progress */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-900">
                    {t('تقدم المزامنة', 'Sync Progress')}
                  </h3>
                  <div className="flex gap-2">
                    {syncProgress.failed > 0 && (
                      <Button
                        onClick={handleClearFailedOperations}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('مسح الفاشلة', 'Clear Failed')}
                      </Button>
                    )}
                    <Button
                      onClick={handleManualSync}
                      disabled={!isOnline || syncProgress.total === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      {t('مزامنة الآن', 'Sync Now')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{syncProgress.total}</div>
                    <div className="text-sm text-gray-500">{t('الإجمالي', 'Total')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{syncProgress.completed}</div>
                    <div className="text-sm text-gray-500">{t('مكتمل', 'Completed')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{syncProgress.inProgress}</div>
                    <div className="text-sm text-gray-500">{t('قيد التنفيذ', 'In Progress')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{syncProgress.failed}</div>
                    <div className="text-sm text-gray-500">{t('فشل', 'Failed')}</div>
                  </div>
                </div>

                {syncProgress.total > 0 && (
                  <Progress
                    value={(syncProgress.completed / syncProgress.total) * 100}
                    className="h-2"
                  />
                )}
              </div>

              {/* Operations List */}
              <div className="space-y-3">
                {queuedOperations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {t('لا توجد عمليات معلقة', 'No pending operations')}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    {queuedOperations.map((operation) => (
                      <div key={operation.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getOperationIcon(operation)}
                            <div>
                              <div className="font-medium">
                                {t(`operation_${operation.type}`, operation.type.replace('_', ' '))}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(operation.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(operation.priority)}>
                              {t(`priority_${operation.priority}`, operation.priority)}
                            </Badge>
                            <Badge className={getStatusColor(operation.status)}>
                              {t(`status_${operation.status}`, operation.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {t('النسخ الاحتياطية المتاحة', 'Available Backups')}
                </h3>
                <Button
                  onClick={() => backupService.createManualBackup(teacherId)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {t('إنشاء نسخة احتياطية', 'Create Backup')}
                </Button>
              </div>

              {backups.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {t('لا توجد نسخ احتياطية', 'No backups available')}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {backups.map((backup) => (
                    <div key={backup.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {new Date(backup.timestamp).toLocaleString()}
                            </span>
                            <Badge variant="outline">
                              {backup.operation}
                            </Badge>
                            {backup.integrity === 'verified' ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                {t('موثوق', 'Verified')}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                {t('تالف', 'Corrupted')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('حجم', 'Size')}: {backup.data?.length || 0} {t('عنصر', 'items')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleRestoreFromBackup(backup)}
                            variant="outline"
                            size="sm"
                            disabled={backup.integrity !== 'verified'}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {t('استعادة', 'Restore')}
                          </Button>
                          <Button
                            onClick={() => handleDeleteBackup(backup.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* System Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
                    {t('حالة الاتصال', 'Connection Status')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">{t('الحالة', 'Status')}</div>
                      <div className="font-medium">
                        {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{t('الجودة', 'Quality')}</div>
                      <div className="font-medium">
                        {isConnectedExcellent ? (language === 'ar' ? 'ممتازة' : 'Excellent') :
                         isConnectedGood ? (language === 'ar' ? 'جيدة' : 'Good') :
                         isConnectedPoor ? (language === 'ar' ? 'ضعيفة' : 'Poor') :
                         (language === 'ar' ? 'غير متصل' : 'Offline')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Queue Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    {t('حالة الطابور', 'Queue Status')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">{t('العمليات المعلقة', 'Pending Operations')}</div>
                      <div className="font-medium">{syncProgress.total}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{t('معدل النجاح', 'Success Rate')}</div>
                      <div className="font-medium">
                        {syncProgress.total > 0
                          ? `${Math.round((syncProgress.completed / syncProgress.total) * 100)}%`
                          : '100%'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    {t('حالة التخزين', 'Storage Status')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t('النسخ الاحتياطية', 'Backups')}</span>
                      <span className="font-medium">{backups.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t('المساحة المستخدمة', 'Storage Used')}</span>
                      <span className="font-medium">
                        {Math.round(JSON.stringify(backups).length / 1024)} KB
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryDashboard;