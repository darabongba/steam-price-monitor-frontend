import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Edit, Trash2, TrendingDown, Percent } from 'lucide-react';
import { PriceAlert } from '@/types/alert';
import { useAlertStore } from '@/stores/alertStore';
import { formatPrice } from '@/utils/priceUtils';
import { getRelativeTime } from '@/utils/dateUtils';
import { validatePrice } from '@/utils/validators';
import Button from '@/components/common/Button';

interface AlertCardProps {
  alert: PriceAlert;
  compact?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, compact = false }) => {
  const { deleteAlert, toggleAlert, updateAlert, loading } = useAlertStore();
  
  // 编辑状态管理
  const [showEditForm, setShowEditForm] = useState(false);
  const [targetDiscountPercent, setTargetDiscountPercent] = useState(30);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customTargetPrice, setCustomTargetPrice] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(true);

  // 根据当前 alert 数据初始化表单
  useEffect(() => {
    if (alert.targetDiscountPercent && alert.targetDiscountPercent > 0) {
      setUseCustomPrice(false);
      setTargetDiscountPercent(alert.targetDiscountPercent);
    } else {
      setUseCustomPrice(true);
      setCustomTargetPrice(alert.targetPrice);
    }
    setPushEnabled(true); // 目前没有存储推送设置，默认为true
  }, [alert]);

  // 计算基于折扣百分比的目标价格
  const discountTargetPrice = alert.originalPrice * (1 - targetDiscountPercent / 100);
  const finalTargetPrice = useCustomPrice ? customTargetPrice : discountTargetPrice;

  const handleToggle = () => {
    toggleAlert(alert.id);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个价格提醒吗？')) {
      deleteAlert(alert.id);
    }
  };

  const handleToggleEdit = () => {
    setShowEditForm(!showEditForm);
  };

  const handleUpdateAlert = async () => {
    if (!useCustomPrice && (targetDiscountPercent < 1 || targetDiscountPercent > 99)) {
      window.alert('折扣百分比必须在 1% 到 99% 之间');
      return;
    }

    if (useCustomPrice) {
      const priceValidation = validatePrice(customTargetPrice);
      if (!priceValidation.isValid) {
        window.alert(priceValidation.error);
        return;
      }
    }

    try {
      await updateAlert(alert.id, {
        targetPrice: finalTargetPrice,
        targetDiscountPercent: useCustomPrice ? undefined : targetDiscountPercent,
      });
      
      setShowEditForm(false);
    } catch (error) {
      console.error('更新提醒失败:', error);
    }
  };

  const handleCancelEdit = () => {
    // 重置表单到原始状态
    if (alert.targetDiscountPercent && alert.targetDiscountPercent > 0) {
      setUseCustomPrice(false);
      setTargetDiscountPercent(alert.targetDiscountPercent);
    } else {
      setUseCustomPrice(true);
      setCustomTargetPrice(alert.targetPrice);
    }
    setShowEditForm(false);
  };

  // 计算实际目标价格（基于折扣的需要换算）
  const actualTargetPrice = alert.targetDiscountPercent && alert.targetDiscountPercent > 0
    ? alert.originalPrice * (1 - alert.targetDiscountPercent / 100)
    : alert.targetPrice;

  // 检查价格是否达到目标
  const priceReached = alert.currentPrice <= actualTargetPrice;
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
              目标: {formatPrice(actualTargetPrice,{currency:alert.currency})}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              当前: {formatPrice(alert.currentPrice,{currency:alert.currency})}
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
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  目标价格
                  {alert.targetDiscountPercent && (
                    <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                      ({alert.targetDiscountPercent}% 折扣)
                    </span>
                  )}
                </label>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPrice(alert.targetPrice,{currency:alert.currency})}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">当前价格</label>
                <p className={`text-lg font-bold ${priceReached ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {formatPrice(alert.currentPrice,{currency:alert.currency})}
                </p>
              </div>
            </div>

            {priceReached && (
              <div className="flex items-center space-x-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                  目标价格已达到！
                  {alert.targetDiscountPercent && (
                    <span className="ml-1">
                      (达到 {alert.targetDiscountPercent}% 折扣)
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400">
              创建于 {getRelativeTime(alert.createdAt)}
            </div>

            <div className="flex items-center space-x-2 mt-2">
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
              onClick={handleToggleEdit}
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

        {/* 手风琴式编辑表单 */}
        {showEditForm && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-t border-gray-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* 提醒类型选择 */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">提醒类型</h5>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`editAlertType-${alert.id}`}
                    checked={!useCustomPrice}
                    onChange={() => setUseCustomPrice(false)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      按折扣百分比提醒
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`editAlertType-${alert.id}`}
                    checked={useCustomPrice}
                    onChange={() => setUseCustomPrice(true)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      按目标价格提醒
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* 折扣百分比输入 */}
            {!useCustomPrice && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  目标折扣百分比
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={targetDiscountPercent}
                    onChange={(e) => setTargetDiscountPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    = <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(discountTargetPrice, {currency: alert.currency})}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* 自定义价格输入 */}
            {useCustomPrice && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  目标价格
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value))}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="输入目标价格"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">元</span>
                </div>
              </div>
            )}

            {/* 通知设置 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`editPushEnabled-${alert.id}`}
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`editPushEnabled-${alert.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                启用推送通知
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateAlert}
                loading={loading}
                className="flex-1"
                icon={<Bell className="w-4 h-4" />}
              >
                保存更改
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;