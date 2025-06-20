import React from 'react';
import { Bell, BellOff, Edit, Trash2, TrendingDown } from 'lucide-react';
import { PriceAlert } from '@/types/alert';
import { useAlertStore } from '@/stores/alertStore';
import { formatPrice } from '@/utils/priceUtils';
import { getRelativeTime } from '@/utils/dateUtils';
import Button from '@/components/common/Button';

interface AlertCardProps {
  alert: PriceAlert;
  compact?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, compact = false }) => {
  const { deleteAlert, toggleAlert } = useAlertStore();

  const handleToggle = () => {
    toggleAlert(alert.id);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个价格提醒吗？')) {
      deleteAlert(alert.id);
    }
  };

  const priceReached = alert.currentPrice <= alert.targetPrice;
  const statusColor = alert.isActive 
    ? (priceReached ? 'text-green-600' : 'text-blue-600')
    : 'text-gray-500';

  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {alert.gameName}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              目标: {formatPrice(alert.targetPrice)}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              当前: {formatPrice(alert.currentPrice)}
            </span>
          </div>
        </div>
        <div className={`flex items-center ${statusColor}`}>
          {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {alert.gameName}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">目标价格</label>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPrice(alert.targetPrice)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">当前价格</label>
                <p className={`text-lg font-bold ${priceReached ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {formatPrice(alert.currentPrice)}
                </p>
              </div>
            </div>

            {priceReached && (
              <div className="flex items-center space-x-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                  目标价格已达到！
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400">
              创建于 {getRelativeTime(alert.createdAt)}
            </div>
            
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center space-x-1">
                <Bell className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">邮件通知</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bell className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">推送通知</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center ${statusColor}`}>
            {alert.isActive ? (
              <Bell className="w-6 h-6" />
            ) : (
              <BellOff className="w-6 h-6" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              alert.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {alert.isActive ? '活跃' : '已暂停'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggle}
              icon={alert.isActive ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            >
              {alert.isActive ? '暂停' : '启用'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Edit className="w-4 h-4" />}
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              icon={<Trash2 className="w-4 h-4" />}
            >
              删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCard; 