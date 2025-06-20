import React, { useEffect, useState } from 'react';
import { Bell, Plus, Search } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import AlertCard from '@/components/PriceAlert/AlertCard';
import Button from '@/components/common/Button';

type FilterType = 'all' | 'active' | 'triggered' | 'paused';

const AlertsPage: React.FC = () => {
  const { alerts, stats, loadAlerts, loading } = useAlertStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = React.useMemo(() => {
    let filtered = alerts;

    // 按状态过滤
    switch (filter) {
      case 'active':
        filtered = filtered.filter(alert => alert.isActive);
        break;
      case 'triggered':
        filtered = filtered.filter(alert => alert.triggeredAt);
        break;
      case 'paused':
        filtered = filtered.filter(alert => !alert.isActive);
        break;
    }

    // 按搜索查询过滤
    if (searchQuery) {
      filtered = filtered.filter(alert =>
        alert.gameName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [alerts, filter, searchQuery]);

  const filterButtons = [
    { key: 'all' as const, label: '全部', count: stats.total },
    { key: 'active' as const, label: '活跃', count: stats.active },
    { key: 'triggered' as const, label: '已触发', count: stats.triggered },
    { key: 'paused' as const, label: '已暂停', count: stats.paused },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            价格提醒
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            管理您的游戏价格提醒
          </p>
        </div>
        <Button
          icon={<Plus className="w-5 h-5" />}
          onClick={() => {
            // 导航到搜索页面
            window.location.href = '/search';
          }}
        >
          添加提醒
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {filterButtons.map(({ key, label, count }) => (
          <div key={key} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 搜索和过滤器 */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 搜索栏 */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索游戏名称..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 过滤器按钮 */}
            <div className="flex items-center space-x-2">
              {filterButtons.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 提醒列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner w-8 h-8" />
          </div>
        ) : filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        ) : searchQuery ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              没有找到匹配的提醒
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              尝试使用不同的搜索关键词
            </p>
          </div>
        ) : filter !== 'all' ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              没有{filterButtons.find(b => b.key === filter)?.label}的提醒
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              您可以创建新的价格提醒
            </p>
            <Button
              onClick={() => {
                window.location.href = '/search';
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              添加提醒
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              还没有价格提醒
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              开始监控您感兴趣的游戏价格
            </p>
            <Button
              onClick={() => {
                window.location.href = '/search';
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              创建第一个提醒
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage; 