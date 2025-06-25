import React, { useState, useEffect } from 'react';
import { Save, Mail, Bell, Download, Upload, Trash2, Settings } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { storageService } from '@/services/storageService';
import Button from '@/components/common/Button';

interface EmailSettings {
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  dailySummary: boolean;
  priceDropThreshold: number;
}

const SettingsPage: React.FC = () => {
  const { stats } = useAlertStore();
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    serviceId: '',
    templateId: '',
    publicKey: '',
    enabled: false,
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailEnabled: false,
    dailySummary: false,
    priceDropThreshold: 20,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 从存储中加载设置
      const savedEmailSettings = localStorage.getItem('emailSettings');
      const savedNotificationSettings = localStorage.getItem('notificationSettings');

      if (savedEmailSettings) {
        setEmailSettings(JSON.parse(savedEmailSettings));
      }

      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // 保存到本地存储
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));


      alert('设置保存成功！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败，请重试');
    } finally {
      setLoading(false);
    }
  };



  const exportData = async () => {
    try {
      const data = await storageService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steam-alerts-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await storageService.importData(data);
      alert('数据导入成功！');
      window.location.reload();
    } catch (error) {
      console.error('导入数据失败:', error);
      alert('导入数据失败，请检查文件格式');
    }
  };

  const clearAllData = async () => {
    if (!window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      await storageService.clearAllData();
      localStorage.clear();
      alert('所有数据已清除');
      window.location.reload();
    } catch (error) {
      console.error('清除数据失败:', error);
      alert('清除数据失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          设置
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          配置邮件通知和应用选项
        </p>
      </div>

      {/* 邮件设置 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              邮件通知设置
            </h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={emailSettings.enabled}
              onChange={(e) => setEmailSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-900 dark:text-white">
              启用邮件通知
            </label>
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              通知设置
            </h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="pushEnabled"
                checked={notificationSettings.pushEnabled}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushEnabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="pushEnabled" className="text-sm font-medium text-gray-900 dark:text-white">
                启用浏览器推送通知
              </label>
            </div>

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              价格下降阈值 (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={notificationSettings.priceDropThreshold}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, priceDropThreshold: parseInt(e.target.value) || 20 }))}
              className="input-field w-32"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              当价格下降超过此百分比时发送通知
            </p>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              数据管理
            </h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">总提醒数</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.active}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">活跃提醒</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.triggered}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">已触发</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={exportData}
              icon={<Download className="w-4 h-4" />}
            >
              导出数据
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                icon={<Upload className="w-4 h-4" />}
              >
                导入数据
              </Button>
            </div>

            <Button
              variant="danger"
              onClick={clearAllData}
              icon={<Trash2 className="w-4 h-4" />}
            >
              清除所有数据
            </Button>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          loading={loading}
          icon={<Save className="w-5 h-5" />}
        >
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;