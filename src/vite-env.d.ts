/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Steam API配置
  readonly VITE_STEAM_API_PROXY: string
  readonly VITE_STEAM_API_KEY: string
  readonly VITE_STEAM_WEB_API_KEY: string
  readonly VITE_STEAMAPI_IO_KEY: string
  
  // EmailJS配置
  readonly VITE_EMAILJS_SERVICE_ID: string
  readonly VITE_EMAILJS_TEMPLATE_ID: string
  readonly VITE_EMAILJS_USER_ID: string
  readonly VITE_EMAILJS_PUBLIC_KEY: string
  
  // 应用配置
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
  
  // 调试模式
  readonly VITE_DEBUG_MODE: string
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_LOG_LEVEL: string
  
  // 缓存配置
  readonly VITE_CACHE_DURATION: string
  readonly VITE_PRICE_CHECK_INTERVAL: string
  
  // CORS代理
  readonly VITE_CORS_PROXY: string
  
  // 通知配置
  readonly VITE_DEFAULT_CHECK_INTERVAL: string
  readonly VITE_MAX_ALERTS_PER_USER: string
  
  // PWA配置
  readonly VITE_PWA_ENABLED: string
  readonly VITE_SW_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 全局类型扩展
declare global {
  const __BUILD_TIME__: string;
} 