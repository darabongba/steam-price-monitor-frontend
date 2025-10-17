import React from 'react';
import { VideoListProps, GroupedVideos } from '../../types/bilibili';
import DateGroup from './DateGroup';

const VideoList: React.FC<VideoListProps> = ({ videos, onVideoClick }) => {
  // 按日期分组视频
  const groupVideosByDate = (videos: any[]): GroupedVideos => {
    const grouped: GroupedVideos = {};
    
    videos.forEach(video => {
      try {
        // 从timestamp中提取日期
        const date = new Date(video.timestamp);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(video);
      } catch (error) {
        console.warn('Invalid timestamp for video:', video.bvId, error);
        // 如果时间戳无效，使用一个默认日期
        const defaultDate = '2024-01-01';
        if (!grouped[defaultDate]) {
          grouped[defaultDate] = [];
        }
        grouped[defaultDate].push(video);
      }
    });
    
    // 按日期排序（最新的在前）
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const sortedGrouped: GroupedVideos = {};
    
    sortedDates.forEach(date => {
      // 每个日期组内的视频按时间戳排序（最新的在前）
      sortedGrouped[date] = grouped[date].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
    
    return sortedGrouped;
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">暂无视频数据</p>
        <p className="text-sm mt-1">请检查数据文件或稍后再试</p>
      </div>
    );
  }

  const groupedVideos = groupVideosByDate(videos);
  const dates = Object.keys(groupedVideos);

  return (
    <div className="space-y-8">
      {dates.map(date => (
        <DateGroup
          key={date}
          date={date}
          videos={groupedVideos[date]}
          onVideoClick={onVideoClick}
        />
      ))}
    </div>
  );
};

export default VideoList;
