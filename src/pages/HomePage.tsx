import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, TrendingDown, Star, BarChart3 } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useAlertStore } from '@/stores/alertStore';
import GameCard from '@/components/GameSearch/GameCard';
import AlertCard from '@/components/PriceAlert/AlertCard';

const HomePage: React.FC = () => {
  const { popularGames, loadPopularGames, loading: gamesLoading } = useGameStore();
  const { alerts, stats, loadAlerts } = useAlertStore();

  useEffect(() => {
    loadPopularGames();
    loadAlerts();
  }, [loadPopularGames, loadAlerts]);

  const recentAlerts = alerts.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* 欢迎横幅 */}
      <div className="steam-gradient text-white rounded-lg p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Steam 游戏降价提醒
          </h1>
          <p className="text-xl opacity-90 mb-6">
            永远不错过心仪游戏的最佳价格
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/search"
              className="btn-primary bg-white text-blue-600 hover:bg-gray-100 flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>搜索游戏</span>
            </Link>
            <Link
              to="/alerts"
              className="btn-secondary bg-blue-700 text-white hover:bg-blue-800 flex items-center space-x-2"
            >
              <Bell className="w-5 h-5" />
              <span>我的提醒</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总提醒数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">活跃提醒</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <TrendingDown className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">已触发</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.triggered}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">已暂停</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {stats.paused}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 热门游戏 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                热门游戏
              </h2>
              <Link
                to="/search"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
              >
                查看更多
              </Link>
            </div>
          </div>
          <div className="card-body">
            {gamesLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner w-8 h-8" />
              </div>
            ) : popularGames.length > 0 ? (
              <div className="space-y-4">
                {popularGames.slice(0, 3).map((game) => (
                  <GameCard key={game.id} game={game} compact />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                暂无热门游戏数据
              </div>
            )}
          </div>
        </div>

        {/* 最近的提醒 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                最近的提醒
              </h2>
              <Link
                to="/alerts"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
              >
                查看全部
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} compact />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  还没有价格提醒
                </p>
                <Link
                  to="/search"
                  className="btn-primary text-sm"
                >
                  创建第一个提醒
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            快速操作
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/search"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                搜索游戏
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                查找并添加想要监控的游戏
              </p>
            </Link>

            <Link
              to="/alerts"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                管理提醒
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                查看和管理所有价格提醒
              </p>
            </Link>

            <Link
              to="/settings"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                设置
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                配置邮件通知和其他选项
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 