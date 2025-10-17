import React from 'react';
import { DateGroupProps } from '../../types/bilibili';
import VideoCard from './VideoCard';
import { cn } from '../../utils/cn';

const DateGroup: React.FC<DateGroupProps> = ({ date, videos, onVideoClick }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 重置时间到00:00:00进行比较
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      
      if (dateOnly.getTime() === todayOnly.getTime()) {
        return '今天';
      } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return '昨天';
      } else {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="mb-8">
      {/* 日期标题 */}
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatDate(date)}
        </h2>
        <div className="ml-3 flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-gray-600 to-transparent" />
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {videos.length} 个视频
        </span>
      </div>

      {/* 视频网格 */}
      <div className={cn(
        "grid gap-4",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      )}>
        {videos.map((video) => (
          <VideoCard
            key={video.bvId}
            video={video}
            onClick={onVideoClick}
          />
        ))}
      </div>
    </div>
  );
};

export default DateGroup;
