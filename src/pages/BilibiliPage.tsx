import React, { useState, useEffect } from 'react';
import { BilibiliVideo } from '../types/bilibili';
import VideoList from '../components/Bilibili/VideoList';
import Loading from '../components/common/Loading';
import { cn } from '../utils/cn';

const BilibiliPage: React.FC = () => {
  const [videos, setVideos] = useState<BilibiliVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 加载视频数据
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/bilibili-videos-data.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setVideos(data);
        
        // 设置最后更新时间
        if (data.length > 0) {
          const latestVideo = data.reduce((latest: BilibiliVideo, current: BilibiliVideo) => 
            new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
          );
          setLastUpdated(new Date(latestVideo.timestamp).toLocaleString('zh-CN'));
        }
        
      } catch (err) {
        console.error('加载视频数据失败:', err);
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  // 处理视频点击
  const handleVideoClick = (video: BilibiliVideo) => {
    // 在新标签页打开视频
    window.open(video.videoUrl, '_blank');
  };

  // 刷新数据
  const handleRefresh = () => {
    window.location.reload();
  };

  // 统计信息
  const getStats = () => {
    if (videos.length === 0) return null;
    
    const totalVideos = videos.length;
    const totalPlayCount = videos.reduce((sum, video) => {
      const count = video.playCount.replace(/[万千]/g, '').replace(/\./g, '');
      const num = parseFloat(count);
      if (video.playCount.includes('万')) {
        return sum + num * 10000;
      } else if (video.playCount.includes('千')) {
        return sum + num * 1000;
      }
      return sum + num;
    }, 0);
    
    const uniqueAuthors = new Set(videos.map(v => v.author)).size;
    
    return {
      totalVideos,
      totalPlayCount: totalPlayCount >= 10000 ? `${(totalPlayCount / 10000).toFixed(1)}万` : totalPlayCount.toString(),
      uniqueAuthors
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                加载失败
              </h3>
              <p className="text-red-600 dark:text-red-300 mb-4">
                {error}
              </p>
              <button
                onClick={handleRefresh}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题和统计信息 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                B站视频收藏
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                按抓取时间分组的视频列表
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button
                onClick={handleRefresh}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200",
                  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                  "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
              </button>
            </div>
          </div>

          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总视频数</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalVideos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总播放量</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalPlayCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">UP主数量</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.uniqueAuthors}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 最后更新时间 */}
          {lastUpdated && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              最后更新: {lastUpdated}
            </div>
          )}
        </div>

        {/* 视频列表 */}
        <VideoList videos={videos} onVideoClick={handleVideoClick} />
      </div>
    </div>
  );
};

export default BilibiliPage;
