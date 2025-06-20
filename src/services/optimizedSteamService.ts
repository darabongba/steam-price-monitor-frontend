import { corsProxyManager } from '@/utils/corsProxies';
import { Game, GamePrice } from '@/types/game';

// 请求队列管理
class RequestQueue {
  private queue: Array<{
    url: string;
    resolve: (data: any) => void;
    reject: (error: any) => void;
    timestamp: number;
  }> = [];
  
  private processing = false;
  private batchSize = 5; // 批量处理大小
  private batchDelay = 1000; // 批量处理间隔(ms)

  async add(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        url,
        resolve,
        reject,
        timestamp: Date.now(),
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    try {
      const batch = this.queue.splice(0, this.batchSize);
      
      // 并行处理批量请求
      const results = await Promise.allSettled(
        batch.map(item => this.makeRequest(item.url))
      );
      
      // 处理结果
      batch.forEach((item, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          item.resolve(result.value);
        } else {
          item.reject(result.reason);
        }
      });
      
      // 延迟处理下一批
      if (this.queue.length > 0) {
        setTimeout(() => {
          this.processing = false;
          this.processQueue();
        }, this.batchDelay);
      } else {
        this.processing = false;
      }
      
    } catch (error) {
      this.processing = false;
      console.error('Batch processing error:', error);
    }
  }

  private async makeRequest(url: string) {
    const proxy = corsProxyManager.getAvailableProxy();
    if (!proxy) {
      throw new Error('No available proxy');
    }

    try {
      const response = await fetch(proxy.url + encodeURIComponent(url), {
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      corsProxyManager.markProxyError(proxy.name);
      throw error;
    }
  }
}

// 智能缓存管理
class SmartCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccess: number;
  }>();
  
  private maxSize = 500; // 最大缓存条目数
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // 更新访问统计
    item.accessCount++;
    item.lastAccess = now;
    
    return item.data;
  }
  
  set(key: string, data: any, ttl: number = 300000) { // 默认5分钟
    // 如果缓存已满，清理最少使用的条目
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now(),
    });
  }
  
  private evict() {
    // LRU清理策略
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      // 按访问频率和最后访问时间排序
      const aScore = a[1].accessCount / (Date.now() - a[1].lastAccess);
      const bScore = b[1].accessCount / (Date.now() - b[1].lastAccess);
      return aScore - bScore;
    });
    
    // 删除25%的最少使用条目
    const deleteCount = Math.floor(this.cache.size * 0.25);
    for (let i = 0; i < deleteCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
  
  clear() {
    this.cache.clear();
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }
  
  private calculateHitRate() {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, item) => sum + item.accessCount, 0);
    return totalAccess / entries.length || 0;
  }
}

export class OptimizedSteamService {
  private requestQueue = new RequestQueue();
  private cache = new SmartCache();
  private requestDeduplication = new Map<string, Promise<any>>();
  
  // 搜索游戏 - 优化版
  async searchGames(query: string, limit: number = 20): Promise<Game[]> {
    const cacheKey = `search:${query}:${limit}`;
    
    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 请求去重
    const requestKey = cacheKey;
    if (this.requestDeduplication.has(requestKey)) {
      return this.requestDeduplication.get(requestKey)!;
    }
    
    const request = this.performSearch(query, limit);
    this.requestDeduplication.set(requestKey, request);
    
    try {
      const result = await request;
      this.cache.set(cacheKey, result, 300000); // 5分钟缓存
      return result;
    } finally {
      this.requestDeduplication.delete(requestKey);
    }
  }
  
  private async performSearch(query: string, limit: number): Promise<Game[]> {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=schinese&cc=CN`;
    
    const response = await this.requestQueue.add(url);
    
    if (!response?.items) return [];
    
    return response.items.slice(0, limit).map((item: any) => ({
      id: crypto.randomUUID(),
      steamId: String(item.id),
      name: item.name,
      imageUrl: item.tiny_image || '',
      description: item.short_description || '',
      developer: item.developer || '未知',
      publisher: item.publisher || '未知',
      tags: [],
      categories: [],
      genres: [],
      releaseDate: item.release_date || '',
      platforms: {
        windows: item.platforms?.windows || false,
        mac: item.platforms?.mac || false,
        linux: item.platforms?.linux || false,
      },
      lastUpdated: new Date(),
      createdAt: new Date(),
    }));
  }
  
  // 批量获取游戏价格
  async getBatchGamePrices(steamIds: string[]): Promise<Record<string, GamePrice | null>> {
    const result: Record<string, GamePrice | null> = {};
    const uncached: string[] = [];
    
    // 检查缓存
    for (const steamId of steamIds) {
      const cacheKey = `price:${steamId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        result[steamId] = cached;
      } else {
        uncached.push(steamId);
      }
    }
    
    if (uncached.length === 0) return result;
    
    // 批量请求未缓存的价格
    const batchSize = 10;
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      const batchResults = await this.fetchBatchPrices(batch);
      
      for (const [steamId, price] of Object.entries(batchResults)) {
        result[steamId] = price;
        this.cache.set(`price:${steamId}`, price, 300000); // 5分钟缓存
      }
    }
    
    return result;
  }
  
  private async fetchBatchPrices(steamIds: string[]): Promise<Record<string, GamePrice | null>> {
    const results: Record<string, GamePrice | null> = {};
    
    // 并行请求每个游戏的价格
    const promises = steamIds.map(async (steamId) => {
      try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${steamId}&filters=price_overview&l=schinese&cc=CN`;
        const response = await this.requestQueue.add(url);
        
        if (response?.[steamId]?.success && response[steamId].data?.price_overview) {
          const priceData = response[steamId].data.price_overview;
          return {
            steamId,
            price: priceData.final / 100,
            originalPrice: priceData.initial / 100,
            discountPercent: priceData.discount_percent,
            currency: priceData.currency,
            formatted: priceData.final_formatted,
            isFree: false,
            onSale: priceData.discount_percent > 0,
            lastUpdated: new Date(),
          };
        }
        
        return null;
      } catch (error) {
        console.error(`Failed to fetch price for ${steamId}:`, error);
        return null;
      }
    });
    
    const prices = await Promise.allSettled(promises);
    
    steamIds.forEach((steamId, index) => {
      const result = prices[index];
      if (result.status === 'fulfilled') {
        results[steamId] = result.value;
      } else {
        results[steamId] = null;
      }
    });
    
    return results;
  }
  
  // 获取服务统计信息
  getServiceStats() {
    return {
      cache: this.cache.getStats(),
      proxies: corsProxyManager.getProxyStats(),
      activeRequests: this.requestDeduplication.size,
    };
  }
  
  // 清理缓存
  clearCache() {
    this.cache.clear();
    this.requestDeduplication.clear();
  }
} 