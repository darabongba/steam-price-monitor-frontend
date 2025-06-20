// 简化版日期工具，不依赖外部库

// 日期格式化选项
export const DATE_FORMATS = {
  SHORT: 'yyyy-MM-dd',
  LONG: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm:ss',
  MONTH_DAY: 'MM-dd',
  YEAR_MONTH: 'yyyy-MM',
  RELATIVE: 'relative',
  DISTANCE: 'distance',
} as const;

// 格式化日期
export const formatDate = (
  date: Date | string | number,
  formatType: keyof typeof DATE_FORMATS | string = DATE_FORMATS.LONG
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '无效日期';
    }

    switch (formatType) {
      case DATE_FORMATS.RELATIVE:
        return getRelativeTime(dateObj);
      case DATE_FORMATS.DISTANCE:
        return getDistanceTime(dateObj);
      case DATE_FORMATS.SHORT:
        return dateObj.toLocaleDateString('zh-CN');
      case DATE_FORMATS.TIME:
        return dateObj.toLocaleTimeString('zh-CN');
      case DATE_FORMATS.LONG:
      default:
        return dateObj.toLocaleString('zh-CN');
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return '格式化错误';
  }
};

// 获取相对时间描述
export const getRelativeTime = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}天前`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}年前`;
    }
  } catch (error) {
    console.error('Relative time calculation error:', error);
    return '未知时间';
  }
};

// 获取距离时间描述
export const getDistanceTime = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.abs(Math.floor((now.getTime() - dateObj.getTime()) / 1000));

    if (diffInSeconds < 60) {
      return '不到1分钟';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `约${minutes}分钟`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `约${hours}小时`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `约${days}天`;
    }
  } catch (error) {
    console.error('Distance time calculation error:', error);
    return '未知时间';
  }
};

// 检查日期是否为今天
export const isToday = (date: Date | string | number): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const today = new Date();
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

// 检查日期是否为本周
export const isThisWeek = (date: Date | string | number): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return dateObj >= weekStart && dateObj <= weekEnd;
  } catch {
    return false;
  }
};

// 获取时间差（毫秒）
export const getTimeDifference = (
  date1: Date | string | number,
  date2: Date | string | number = new Date()
): number => {
  try {
    const dateObj1 = typeof date1 === 'string' ? new Date(date1) : new Date(date1);
    const dateObj2 = typeof date2 === 'string' ? new Date(date2) : new Date(date2);
    
    return Math.abs(dateObj2.getTime() - dateObj1.getTime());
  } catch {
    return 0;
  }
};

// 添加时间间隔
export const addTimeInterval = (
  date: Date | string | number,
  interval: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' = 'hours'
): Date => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const multipliers = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000, // 近似值
    };
    
    const multiplier = multipliers[unit] || 1;
    return new Date(dateObj.getTime() + interval * multiplier);
  } catch (error) {
    console.error('Add time interval error:', error);
    return new Date();
  }
};

// 格式化持续时间
export const formatDuration = (milliseconds: number): string => {
  try {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  } catch (error) {
    console.error('Duration formatting error:', error);
    return '0秒';
  }
};

// 获取日期范围的描述
export const getDateRangeDescription = (
  startDate: Date | string | number,
  endDate: Date | string | number
): string => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
    const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);
    
    const startStr = start.toLocaleDateString('zh-CN');
    const endStr = end.toLocaleDateString('zh-CN');
    
    if (startStr === endStr) {
      return startStr;
    }
    
    return `${startStr} 至 ${endStr}`;
  } catch (error) {
    console.error('Date range description error:', error);
    return '日期范围错误';
  }
};

// 检查日期是否在范围内
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean => {
  try {
    const checkDate = typeof date === 'string' ? new Date(date) : new Date(date);
    const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
    const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);
    
    return checkDate >= start && checkDate <= end;
  } catch {
    return false;
  }
};

// 获取时区偏移
export const getTimezoneOffset = (): string => {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? '+' : '-';
  
  return `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// 解析Steam日期格式
export const parseSteamDate = (steamDate: string): Date | null => {
  try {
    // Steam日期格式通常为 "Mar 5, 2020"
    const date = new Date(steamDate);
    return !isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
};

// 获取下次检查时间
export const getNextCheckTime = (
  lastCheck: Date | string | number,
  interval: number
): Date => {
  try {
    const lastCheckDate = typeof lastCheck === 'string' ? new Date(lastCheck) : new Date(lastCheck);
    return new Date(lastCheckDate.getTime() + interval);
  } catch (error) {
    console.error('Next check time calculation error:', error);
    return new Date();
  }
}; 