// B站视频数据类型定义
export interface BilibiliVideo {
  bvId: string;
  timestamp: string;
  videoUrl: string;
  title: string;
  coverUrl: string;
  playCount: string;
  duration: string;
  author: string;
  authorSpaceUrl: string;
  publishDate: string;
}

// 按日期分组的视频数据
export interface GroupedVideos {
  [date: string]: BilibiliVideo[];
}

// 视频卡片组件属性
export interface VideoCardProps {
  video: BilibiliVideo;
  onClick?: (video: BilibiliVideo) => void;
}

// 视频列表组件属性
export interface VideoListProps {
  videos: BilibiliVideo[];
  onVideoClick?: (video: BilibiliVideo) => void;
}

// 日期分组组件属性
export interface DateGroupProps {
  date: string;
  videos: BilibiliVideo[];
  onVideoClick?: (video: BilibiliVideo) => void;
}
