import React from 'react';
import { VideoCardProps } from '../../types/bilibili';
import { cn } from '../../utils/cn';

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(video);
    } else {
      // 默认行为：在新标签页打开视频
      window.open(video.videoUrl, '_blank');
    }
  };

  const formatPlayCount = (playCount: string) => {
    // 如果已经是中文格式（如"34万"），直接返回
    if (playCount.includes('万') || playCount.includes('千')) {
      return playCount;
    }

    // 如果是数字，转换为中文格式
    const num = parseInt(playCount);
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}千`;
    }
    return playCount;
  };

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden",
        "hover:scale-[1.02] hover:-translate-y-1"
      )}
      onClick={handleClick}
    >
      {/* 视频封面 */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.coverUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* 播放时长 */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>

        {/* 播放按钮覆盖层 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 bg-red-500 bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 视频信息 */}
      <div className="p-4">
        {/* 标题 */}
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-red-500 transition-colors duration-200">
          {video.title}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="truncate max-w-[120px]">{video.author}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              {formatPlayCount(video.playCount)}
            </span>
            <span>{video.publishDate}</span>
          </div>
        </div>
      </div>

      {/* 悬停效果边框 */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500 rounded-lg transition-colors duration-300 pointer-events-none" />
    </div>
  );
};

export default VideoCard;
