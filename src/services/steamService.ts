import { Game, GamePrice, GameSearchResult, GameDetails } from '@/types/game';
import { STEAM_STORE_BASE, CORS_PROXY, LIMITS } from '@/utils/constants';
import { cache } from '@/utils/storage';

// Steam API服务类
export class SteamService {
  private corsProxy: string;

  constructor() {
    this.corsProxy = CORS_PROXY;
  }

  // 搜索游戏
  async searchGames(query: string, limit: number = LIMITS.MAX_SEARCH_RESULTS): Promise<GameSearchResult> {
    try {
      const cacheKey = `search:${query}:${limit}`;
      const cached = cache.get<GameSearchResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // 使用Steam Store API搜索
      const searchUrl = `${this.corsProxy}${STEAM_STORE_BASE}api/storesearch/?term=${encodeURIComponent(query)}&l=schinese&cc=CN`;
      
      const response = await this.makeRequest(searchUrl);
      
      if (!response || !response.items) {
        return {
          games: [],
          total: 0,
          hasMore: false,
        };
      }

      const games: Game[] = response.items.slice(0, limit).map((item: any) => ({
        id: crypto.randomUUID(),
        steamId: String(item.id),
        name: item.name,
        imageUrl: item.tiny_image || item.small_capsule_image || '',
        headerImage: item.header_image || '',
        description: item.short_description || '',
        shortDescription: item.short_description || '',
        developer: item.developer || '未知开发商',
        publisher: item.publisher || '未知发行商',
        tags: item.tags ? item.tags.split(',').map((tag: string) => tag.trim()) : [],
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

      const result: GameSearchResult = {
        games,
        total: response.total || games.length,
        hasMore: response.total > limit,
      };

      // 缓存结果
      cache.set(cacheKey, result, 30 * 60 * 1000); // 30分钟

      return result;
    } catch (error) {
      console.error('Failed to search games:', error);
      return {
        games: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  // 获取游戏详情
  async getGameDetails(steamId: string): Promise<GameDetails | null> {
    try {
      const cacheKey = `game:${steamId}`;
      const cached = cache.get<GameDetails>(cacheKey);
      if (cached) {
        return cached;
      }

      const detailsUrl = `${this.corsProxy}${STEAM_STORE_BASE}api/appdetails?appids=${steamId}&l=schinese&cc=CN`;
      
      const response = await this.makeRequest(detailsUrl);
      
      if (!response || !response[steamId] || !response[steamId].success) {
        return null;
      }

      const data = response[steamId].data;
      
      const gameDetails: GameDetails = {
        id: crypto.randomUUID(),
        steamId,
        name: data.name,
        imageUrl: data.header_image || '',
        headerImage: data.header_image || '',
        description: data.detailed_description || data.short_description || '',
        shortDescription: data.short_description || '',
        developer: data.developers?.[0] || '未知开发商',
        publisher: data.publishers?.[0] || '未知发行商',
        tags: data.genres?.map((genre: any) => genre.description) || [],
        categories: data.categories?.map((cat: any) => cat.description) || [],
        genres: data.genres?.map((genre: any) => genre.description) || [],
        releaseDate: data.release_date?.date || '',
        platforms: {
          windows: data.platforms?.windows || false,
          mac: data.platforms?.mac || false,
          linux: data.platforms?.linux || false,
        },
        screenshots: data.screenshots?.map((shot: any) => shot.path_full) || [],
        movies: data.movies?.map((movie: any) => movie.webm?.max || movie.webm?.['480']) || [],
        systemRequirements: {
          minimum: data.pc_requirements?.minimum || '',
          recommended: data.pc_requirements?.recommended || '',
        },
        reviews: {
          positive: 0,
          negative: 0,
          total: 0,
          score: 0,
        },
        dlc: data.dlc || [],
        achievements: data.achievements?.total || 0,
        metacriticScore: data.metacritic?.score || undefined,
        steamRating: 0,
        ageRating: data.required_age ? `${data.required_age}+` : '全年龄',
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      // 缓存结果
      cache.set(cacheKey, gameDetails, 60 * 60 * 1000); // 1小时

      return gameDetails;
    } catch (error) {
      console.error('Failed to get game details:', error);
      return null;
    }
  }

  // 获取游戏价格
  async getGamePrice(steamId: string): Promise<GamePrice | null> {
    try {
      const cacheKey = `price:${steamId}`;
      const cached = cache.get<GamePrice>(cacheKey);
      if (cached) {
        return cached;
      }

      // 首先尝试从游戏详情中获取价格
      const detailsUrl = `${this.corsProxy}${STEAM_STORE_BASE}api/appdetails?appids=${steamId}&filters=price_overview&l=schinese&cc=CN`;
      
      const response = await this.makeRequest(detailsUrl);
      
      if (!response || !response[steamId] || !response[steamId].success) {
        return null;
      }

      const data = response[steamId].data;
      const priceOverview = data.price_overview;

      if (!priceOverview) {
        // 免费游戏
        const freePrice: GamePrice = {
          steamId,
          price: 0,
          originalPrice: 0,
          discountPercent: 0,
          currency: 'CNY',
          formatted: '免费',
          isFree: true,
          onSale: false,
          lastUpdated: new Date(),
        };

        cache.set(cacheKey, freePrice, 10 * 60 * 1000); // 10分钟
        return freePrice;
      }

      const gamePrice: GamePrice = {
        steamId,
        price: priceOverview.final / 100,
        originalPrice: priceOverview.initial / 100,
        discountPercent: priceOverview.discount_percent,
        currency: priceOverview.currency,
        formatted: priceOverview.final_formatted,
        isFree: false,
        onSale: priceOverview.discount_percent > 0,
        lastUpdated: new Date(),
      };

      // 缓存结果
      cache.set(cacheKey, gamePrice, 10 * 60 * 1000); // 10分钟

      return gamePrice;
    } catch (error) {
      console.error('Failed to get game price:', error);
      return null;
    }
  }

  // 批量获取游戏价格
  async getBatchGamePrices(steamIds: string[]): Promise<Record<string, GamePrice | null>> {
    const results: Record<string, GamePrice | null> = {};
    
    // 限制并发请求数量
    const batchSize = LIMITS.BATCH_SIZE;
    
    for (let i = 0; i < steamIds.length; i += batchSize) {
      const batch = steamIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (steamId) => {
        const price = await this.getGamePrice(steamId);
        results[steamId] = price;
      });

      await Promise.all(batchPromises);
      
      // 添加延迟避免API限制
      if (i + batchSize < steamIds.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  // 获取热门游戏列表
  async getPopularGames(limit: number = 20): Promise<Game[]> {
    try {
      const cacheKey = `popular:${limit}`;
      const cached = cache.get<Game[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 使用Steam Store的特色和推荐API
      const url = `${this.corsProxy}${STEAM_STORE_BASE}api/featured/?l=schinese&cc=CN`;
      
      const response = await this.makeRequest(url);
      
      if (!response || !response.featured_win) {
        return [];
      }

      const games: Game[] = response.featured_win.slice(0, limit).map((item: any) => ({
        id: crypto.randomUUID(),
        steamId: String(item.id),
        name: item.name,
        imageUrl: item.header_image || '',
        headerImage: item.header_image || '',
        description: item.short_description || '',
        shortDescription: item.short_description || '',
        developer: '未知开发商',
        publisher: '未知发行商',
        tags: [],
        categories: [],
        genres: [],
        releaseDate: '',
        platforms: {
          windows: true,
          mac: false,
          linux: false,
        },
        lastUpdated: new Date(),
        createdAt: new Date(),
      }));

      // 缓存结果
      cache.set(cacheKey, games, 60 * 60 * 1000); // 1小时

      return games;
    } catch (error) {
      console.error('Failed to get popular games:', error);
      return [];
    }
  }

  // 获取游戏评价信息
  async getGameReviews(steamId: string): Promise<{
    positive: number;
    negative: number;
    total: number;
    score: number;
  }> {
    try {
      const cacheKey = `reviews:${steamId}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      // 使用Steam Store Reviews API
      const url = `${this.corsProxy}${STEAM_STORE_BASE}appreviews/${steamId}?json=1&language=schinese&review_type=all&purchase_type=all`;
      
      const response = await this.makeRequest(url);
      
      if (!response || !response.query_summary) {
        return {
          positive: 0,
          negative: 0,
          total: 0,
          score: 0,
        };
      }

      const summary = response.query_summary;
      const total = summary.total_reviews || 0;
      const positive = summary.total_positive || 0;
      const negative = summary.total_negative || 0;
      const score = total > 0 ? Math.round((positive / total) * 100) : 0;

      const result = {
        positive,
        negative,
        total,
        score,
      };

      // 缓存结果
      cache.set(cacheKey, result, 24 * 60 * 60 * 1000); // 24小时

      return result;
    } catch (error) {
      console.error('Failed to get game reviews:', error);
      return {
        positive: 0,
        negative: 0,
        total: 0,
        score: 0,
      };
    }
  }

  // 验证Steam App ID
  async validateSteamId(steamId: string): Promise<boolean> {
    try {
      const details = await this.getGameDetails(steamId);
      return details !== null;
    } catch (error) {
      console.error('Failed to validate steam ID:', error);
      return false;
    }
  }

  // 发起HTTP请求的通用方法
  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LIMITS.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时');
        }
        throw new Error(`网络请求失败: ${error.message}`);
      }
      throw new Error('未知网络错误');
    }
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 清理缓存
  clearCache(): void {
    // 清理Steam相关的缓存
    // 这里可以实现具体的缓存清理逻辑
  }

  // 获取API状态
  async getApiStatus(): Promise<{
    available: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // 简单的健康检查
      await this.makeRequest(`${this.corsProxy}${STEAM_STORE_BASE}api/featured/?l=schinese&cc=CN`);
      
      return {
        available: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}

// 导出单例实例
export const steamService = new SteamService(); 