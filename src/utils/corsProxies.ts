// CORS代理服务配置和管理
export interface CorsProxy {
  name: string;
  url: string;
  rateLimit: number; // 每分钟请求数限制
  status: 'active' | 'inactive' | 'error';
  lastError?: Date;
  errorCount: number;
}

// 免费CORS代理服务列表
export const FREE_CORS_PROXIES: CorsProxy[] = [
  {
    name: 'AllOrigins',
    url: 'https://api.allorigins.win/raw?url=',
    rateLimit: 60,
    status: 'active',
    errorCount: 0,
  },
  {
    name: 'CORS Anywhere (Heroku)',
    url: 'https://cors-anywhere.herokuapp.com/',
    rateLimit: 200,
    status: 'active',
    errorCount: 0,
  },
  {
    name: 'ThingProxy',
    url: 'https://thingproxy.freeboard.io/fetch/',
    rateLimit: 100,
    status: 'active',
    errorCount: 0,
  },
  {
    name: 'JSONP Proxy',
    url: 'https://jsonp.afeld.me/?url=',
    rateLimit: 50,
    status: 'active',
    errorCount: 0,
  },
];

// 代理管理类
export class CorsProxyManager {
  private proxies: CorsProxy[] = [...FREE_CORS_PROXIES];
  private currentIndex = 0;
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  // 获取可用的代理
  getAvailableProxy(): CorsProxy | null {
    const now = Date.now();
    
    // 轮询所有代理，找到可用的
    for (let i = 0; i < this.proxies.length; i++) {
      const proxy = this.proxies[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      if (proxy.status === 'inactive') continue;

      // 检查速率限制
      const key = proxy.name;
      const usage = this.requestCounts.get(key);
      
      if (!usage || now > usage.resetTime) {
        // 重置计数器
        this.requestCounts.set(key, {
          count: 0,
          resetTime: now + 60 * 1000, // 1分钟后重置
        });
      }

      const currentUsage = this.requestCounts.get(key)!;
      if (currentUsage.count < proxy.rateLimit) {
        currentUsage.count++;
        return proxy;
      }
    }

    return null;
  }

  // 标记代理为失败
  markProxyError(proxyName: string) {
    const proxy = this.proxies.find(p => p.name === proxyName);
    if (proxy) {
      proxy.errorCount++;
      proxy.lastError = new Date();
      
      // 连续失败3次则暂时禁用
      if (proxy.errorCount >= 3) {
        proxy.status = 'inactive';
        
        // 5分钟后重新启用
        setTimeout(() => {
          proxy.status = 'active';
          proxy.errorCount = 0;
        }, 5 * 60 * 1000);
      }
    }
  }

  // 重置代理状态
  resetProxy(proxyName: string) {
    const proxy = this.proxies.find(p => p.name === proxyName);
    if (proxy) {
      proxy.status = 'active';
      proxy.errorCount = 0;
      delete proxy.lastError;
    }
  }

  // 获取代理状态
  getProxyStats() {
    return this.proxies.map(proxy => ({
      name: proxy.name,
      status: proxy.status,
      errorCount: proxy.errorCount,
      usage: this.requestCounts.get(proxy.name)?.count || 0,
      rateLimit: proxy.rateLimit,
    }));
  }
}

export const corsProxyManager = new CorsProxyManager(); 