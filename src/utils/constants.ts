// 应用信息
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Steam游戏降价提醒';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

// API配置
export const STEAM_API_BASE = 'https://store.steampowered.com/api/';
export const STEAM_STORE_BASE = 'https://store.steampowered.com/';
export const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || '';

// 第三方API
export const STEAMAPI_IO_BASE = 'https://api.steamapi.io/';
export const STEAM_WEB_API_BASE = 'https://api.steampowered.com/';

// EmailJS配置
export const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  USER_ID: import.meta.env.VITE_EMAILJS_USER_ID || '',
};

// 邮件模板
export const EMAIL_TEMPLATES = {
  PRICE_ALERT: 'price_alert',
  DAILY_SUMMARY: 'daily_summary',
  WELCOME: 'welcome',
  TEST: 'test',
} as const;

// 缓存配置
export const CACHE_DURATION = Number(import.meta.env.VITE_CACHE_DURATION) || 3600000; // 1小时
export const PRICE_CHECK_INTERVAL = Number(import.meta.env.VITE_PRICE_CHECK_INTERVAL) || 3600000; // 1小时

// 数据库配置
export const DB_NAME = 'SteamPriceMonitor';
export const DB_VERSION = 1;

export const DB_STORES = {
  GAMES: 'games',
  ALERTS: 'alerts',
  PRICE_HISTORY: 'priceHistory',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  CACHE: 'cache',
} as const;

// 限制配置
export const LIMITS = {
  MAX_ALERTS_PER_USER: Number(import.meta.env.VITE_MAX_ALERTS_PER_USER) || 50,
  MAX_SEARCH_RESULTS: 50,
  MAX_PRICE_HISTORY_DAYS: 365,
  MAX_CACHE_SIZE: 100,
  MAX_RETRY_ATTEMPTS: 3,
  REQUEST_TIMEOUT: 30000,
  BATCH_SIZE: 10,
  EMAIL_BATCH_SIZE: 3,
};

// UI配置
export const UI = {
  TOAST_DURATION: 5000,
  LOADING_DELAY: 300,
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300,
  PAGINATION_SIZE: 20,
};

// 货币配置
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'GBP', symbol: '£', name: '英镑' },
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'CNY', symbol: '¥', name: '人民币' },
  { code: 'RUB', symbol: '₽', name: '卢布' },
  { code: 'KRW', symbol: '₩', name: '韩元' },
  { code: 'CAD', symbol: 'C$', name: '加元' },
  { code: 'AUD', symbol: 'A$', name: '澳元' },
] as const;

export const DEFAULT_CURRENCY = 'USD';

// 语言配置
export const LANGUAGES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
] as const;

export const DEFAULT_LANGUAGE = 'zh-CN';

// 主题配置
export const THEMES = ['light', 'dark', 'auto'] as const;
export const DEFAULT_THEME = 'auto';

// 频率配置
export const CHECK_FREQUENCIES = [
  { value: 'hourly', label: '每小时', interval: 3600000 },
  { value: 'daily', label: '每天', interval: 86400000 },
  { value: 'weekly', label: '每周', interval: 604800000 },
] as const;

export const DEFAULT_CHECK_FREQUENCY = 'hourly';

// 通知类型
export const NOTIFICATION_TYPES = [
  { value: 'email', label: '邮件通知' },
  { value: 'browser', label: '浏览器通知' },
  { value: 'both', label: '全部通知' },
] as const;

// Steam平台
export const STEAM_PLATFORMS = ['windows', 'mac', 'linux'] as const;

// 游戏标签
export const POPULAR_TAGS = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
  'Sports', 'Racing', 'Indie', 'Casual', 'Multiplayer',
  'Co-op', 'Single-player', 'Free to Play', 'Early Access',
  'VR Supported', 'Controller Support'
] as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  API_ERROR: 'API请求失败，请稍后重试',
  STEAM_API_ERROR: 'Steam API暂时不可用',
  EMAIL_CONFIG_ERROR: '邮件配置错误，请检查设置',
  STORAGE_ERROR: '数据存储失败，请检查浏览器存储权限',
  GAME_NOT_FOUND: '游戏未找到',
  PRICE_UNAVAILABLE: '价格信息暂时不可用',
  ALERT_EXISTS: '该游戏的价格提醒已存在',
  ALERT_LIMIT_REACHED: '已达到提醒数量上限',
  INVALID_PRICE: '请输入有效的价格',
  INVALID_EMAIL: '请输入有效的邮箱地址',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  ALERT_CREATED: '价格提醒创建成功',
  ALERT_UPDATED: '价格提醒更新成功',
  ALERT_DELETED: '价格提醒删除成功',
  SETTINGS_SAVED: '设置保存成功',
  EMAIL_SENT: '邮件发送成功',
  DATA_EXPORTED: '数据导出成功',
  DATA_IMPORTED: '数据导入成功',
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  USER_SETTINGS: 'steam-monitor-settings',
  ALERT_CACHE: 'steam-monitor-alert-cache',
  GAME_CACHE: 'steam-monitor-game-cache',
  LAST_SYNC: 'steam-monitor-last-sync',
  THEME: 'steam-monitor-theme',
  LANGUAGE: 'steam-monitor-language',
} as const;

// Service Worker配置
export const SW_CONFIG = {
  ENABLED: import.meta.env.VITE_SW_ENABLED !== 'false',
  UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
  CACHE_NAME: 'steam-monitor-cache-v1',
  OFFLINE_PAGE: '/offline.html',
};

// PWA配置
export const PWA_CONFIG = {
  ENABLED: import.meta.env.VITE_PWA_ENABLED !== 'false',
  THEME_COLOR: '#667eea',
  BACKGROUND_COLOR: '#ffffff',
  DISPLAY: 'standalone',
  ORIENTATION: 'portrait',
};

// 调试配置
export const DEBUG = {
  ENABLED: import.meta.env.VITE_DEBUG_MODE === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
}; 