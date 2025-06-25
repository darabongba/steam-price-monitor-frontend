import React, { useState } from 'react';
import { Search, Filter, SortAsc, Grid, List } from 'lucide-react';
import { useGameSearch } from '@/hooks/useGameSearch';
import { useGameStore } from '@/stores/gameStore';
import SearchBar from '@/components/GameSearch/SearchBar';
import GameList from '@/components/GameSearch/GameList';
import GameCard from '@/components/GameSearch/GameCard';

type ViewMode = 'grid' | 'list';
type SortBy = 'relevance' | 'price' | 'name' | 'release_date';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  
  const { results: searchResults, loading, error, setQuery } = useGameSearch();
  const { popularGames, loadPopularGames } = useGameStore();

  React.useEffect(() => {
    if (!searchQuery && popularGames.length === 0) {
      loadPopularGames();
    }
  }, [searchQuery, popularGames.length, loadPopularGames]);

  React.useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  const displayGames = searchQuery ? (searchResults?.games || []) : popularGames;

  const sortedGames = React.useMemo(() => {
    if (!displayGames.length) return [];
    
    const sorted = [...displayGames];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => (a.price?.final || 0) - (b.price?.final || 0));
      case 'release_date':
        return sorted.sort((a, b) => 
          new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()
        );
      default:
        return sorted;
    }
  }, [displayGames, sortBy]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            游戏搜索
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            搜索Steam游戏并设置价格提醒
          </p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="card">
        <div className="card-body">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索游戏名称..."
            className="w-full"
          />
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery ? `搜索结果: ${sortedGames.length}` : `热门游戏: ${sortedGames.length}`}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* 排序选择 */}
          <div className="flex items-center space-x-2">
            <SortAsc className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="relevance">相关性</option>
              <option value="name">名称</option>
              <option value="price">价格</option>
              <option value="release_date">发布日期</option>
            </select>
          </div>

          {/* 视图模式切换 */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* 过滤器按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center space-x-2 ${
              showFilters ? 'bg-blue-600 text-white' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>过滤器</span>
          </button>
        </div>
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              过滤选项
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  价格范围
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="最低价格"
                    className="input-field"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="最高价格"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  游戏类型
                </label>
                <select className="input-field">
                  <option value="">所有类型</option>
                  <option value="action">动作</option>
                  <option value="adventure">冒险</option>
                  <option value="rpg">角色扮演</option>
                  <option value="strategy">策略</option>
                  <option value="simulation">模拟</option>
                  <option value="sports">体育</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  发布年份
                </label>
                <select className="input-field">
                  <option value="">所有年份</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="older">更早</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 游戏列表 */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-8 h-8" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                搜索出错: {error}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                重试
              </button>
            </div>
          ) : sortedGames.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedGames.map((game) => (
                  <GameCard key={game.steamId} game={game} />
                ))}
              </div>
            ) : (
              <GameList games={sortedGames} />
            )
          ) : searchQuery ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                没有找到相关游戏
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                尝试使用不同的搜索关键词
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                开始搜索游戏
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                在上方搜索栏中输入游戏名称
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 