import { Game, GamePrice, GameSearchResult, GameDetails } from '@/types/game';

// 静态数据元信息
interface DataMetadata {
  lastUpdated: string;
  gamesCount: number;
  popularGamesCount: number;
  priceHistoryCount: number;
  version: string;
  dataSource: string;
}

// 搜索索引项
interface SearchIndexItem {
  steamId: string;
  name: string;
  developer: string;
  publisher: string;
  tags: string[];
  nameWords: string[];
  searchText: string;
}

// 价格历史记录
interface PriceHistoryRecord {
  date: string;
  price: number;
  originalPrice: number;
  discount: number;
}

// 静态数据服务类
export class StaticDataService {
  private cache = new Map<string, any>();
  private cacheTimestamp = new Map<string, number>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
  private readonly BASE_URL = '/data'; // 静态数据文件路径

  // 获取缓存的数据，如果过期则返回null
  private getCachedData<T>(key: string): T | null {
    const data = this.cache.get(key);
    const timestamp = this.cacheTimestamp.get(key);

    if (!data || !timestamp) return null;

    const now = Date.now();
    if (now - timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.cacheTimestamp.delete(key);
      return null;
    }

    return data;
  }

  // 设置缓存数据
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, data);
    this.cacheTimestamp.set(key, Date.now());
  }

  // 加载JSON文件
  private async loadJSON<T>(filename: string): Promise<T> {
    const cacheKey = `file:${filename}`;
    const cached = this.getCachedData<T>(cacheKey);

    if (cached) {
      console.log(`从缓存加载: ${filename}`);
      return cached;
    }

    try {
      console.log(`从服务器加载: ${filename}`);
      const response = await fetch(`${this.BASE_URL}/${filename}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 无法加载 ${filename}`);
      }

      const data = await response.json();
      this.setCachedData(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`加载 ${filename} 失败:`, error);
      throw new Error(`数据加载失败: ${filename}`);
    }
  }

  // 获取数据元信息
  async getMetadata(): Promise<DataMetadata> {
    return this.loadJSON<DataMetadata>('metadata.json');
  }



  // 获取游戏详情列表
  async getPopularGameDetails(): Promise<GameDetails[]> {
    const details = await this.loadJSON<any[]>('game-details.json');
    return details
  }

  // 获取单个游戏详情
  async getGameDetail(steamId: string): Promise<GameDetails | null> {
    const allDetails = await this.getPopularGameDetails();
    return allDetails.find(game => game.steamId === steamId) || null;
  }

  // 搜索游戏
  async searchGames(query: string, limit: number = 20): Promise<GameSearchResult> {
    if (!query.trim()) {
      return {
        games: [],
        total: 0,
        hasMore: false,
      };
    }

    try {
      const searchIndex = await this.loadJSON<SearchIndexItem[]>('search-index.json');
      const gameDetails = await this.getPopularGameDetails();

      const lowerQuery = query.toLowerCase();
      const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);

      // 计算匹配分数
      const scoredResults = searchIndex
        .map(item => {
          let score = 0;

          // 精确匹配游戏名称
          if (item.name.toLowerCase() === lowerQuery) {
            score += 100;
          } else if (item.name.toLowerCase().includes(lowerQuery)) {
            score += 50;
          }

          // 匹配开发商/发行商
          if (item.developer.toLowerCase().includes(lowerQuery) ||
              item.publisher.toLowerCase().includes(lowerQuery)) {
            score += 30;
          }

          // 匹配标签
          const tagMatches = item.tags.filter(tag =>
            tag.toLowerCase().includes(lowerQuery)
          ).length;
          score += tagMatches * 10;

          // 匹配搜索文本中的词汇
          queryWords.forEach(word => {
            if (item.searchText.includes(word)) {
              score += 5;
            }

            // 模糊匹配单词
            item.nameWords.forEach(nameWord => {
              if (nameWord.includes(word) || word.includes(nameWord)) {
                score += 2;
              }
            });
          });

          return { item, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);

      // 转换为Game对象
      const games: Game[] = scoredResults
        .slice(0, limit)
        .map(result => {
          const detail = gameDetails.find(d => d.steamId === result.item.steamId);

          return {
            steamId: result.item.steamId,
            name: result.item.name,
            type: detail?.type || 'game',
            description: detail?.description || '',
            fullDescription: detail?.fullDescription || detail?.description || '',
            developer: result.item.developer,
            publisher: result.item.publisher,
            releaseDate: detail?.releaseDate || '',
            comingSoon: detail?.comingSoon || false,
            headerImage: detail?.headerImage || '',
            screenshots: detail?.screenshots || [],
            movies: detail?.movies || [],
            genres: detail?.genres || [],
            categories: detail?.categories || [],
            platforms: detail?.platforms || {
              windows: true,
              mac: false,
              linux: false,
            },
            price: {
              currency: detail?.price?.currency || 'CNY',
              initial: detail?.price?.initial || 0,
              final: detail?.price?.final || 0,
              discount_percent: detail?.price?.discount_percent || 0,
              formatted: detail?.price?.formatted || '价格未知',
            },
            isFree: detail?.isFree || false,
            dlc: detail?.dlc || [],
            achievements: detail?.achievements || 0,
            metacriticScore: detail?.metacriticScore,
            recommendations: detail?.recommendations || 0,
            lastUpdated: new Date().toLocaleString(),
          }
        });

      return {
        games,
        total: scoredResults.length,
        hasMore: scoredResults.length > limit,
      };

    } catch (error) {
      console.error('搜索失败:', error);
      return {
        games: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  // 获取游戏价格
  async getGamePrice(steamId: string): Promise<GamePrice | null> {
    try {
      const gameDetail = await this.getGameDetail(steamId);
      if (!gameDetail) return null;

      // 直接从游戏详情中获取价格信息
      if (!gameDetail.price) {
        return {
          steamId,
          final: 0,
          initial: 0,
          discount_percent: 0,
          currency: 'CNY',
          formatted: '价格未知',
          isFree: true,
          onSale: false,
          lastUpdated: new Date().toLocaleString(),
        };
      }

      return {
        steamId,
        final: gameDetail.price.final,
        initial: gameDetail.price.initial,
        discount_percent: gameDetail.price.discount_percent,
        currency: gameDetail.price.currency,
        formatted: gameDetail.price.formatted,
        isFree: gameDetail.isFree,
        onSale: gameDetail.price.discount_percent > 0,
        lastUpdated: new Date().toLocaleString(),
      };

    } catch (error) {
      console.error(`获取游戏 ${steamId} 价格失败:`, error);
      return null;
    }
  }

  // 批量获取游戏价格
  async getBatchGamePrices(steamIds: string[]): Promise<Record<string, GamePrice | null>> {
    const result: Record<string, GamePrice | null> = {};

    // 并行获取所有价格
    const promises = steamIds.map(async (steamId) => {
      const price = await this.getGamePrice(steamId);
      return { steamId, price };
    });

    const results = await Promise.allSettled(promises);

    results.forEach((promiseResult, index) => {
      const steamId = steamIds[index];
      if (promiseResult.status === 'fulfilled') {
        result[steamId] = promiseResult.value.price;
      } else {
        result[steamId] = null;
      }
    });

    return result;
  }

  // 获取价格历史
  async getPriceHistory(steamId: string): Promise<PriceHistoryRecord[]> {
    try {
      const priceHistory = await this.loadJSON<Record<string, PriceHistoryRecord[]>>('price-history.json');
      return priceHistory[steamId] || [];
    } catch (error) {
      console.error(`获取游戏 ${steamId} 价格历史失败:`, error);
      return [];
    }
  }

  // 检查数据是否需要更新
  async checkDataFreshness(): Promise<{
    lastUpdated: Date;
    isStale: boolean;
    hoursOld: number;
  }> {
    try {
      const metadata = await this.getMetadata();
      const lastUpdated = new Date(metadata.lastUpdated);
      const now = new Date();
      const hoursOld = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60));
      const isStale = hoursOld > 24; // 超过24小时视为过期

      return {
        lastUpdated,
        isStale,
        hoursOld,
      };
    } catch (error) {
      console.error('检查数据新鲜度失败:', error);
      return {
        lastUpdated: new Date(0),
        isStale: true,
        hoursOld: 999,
      };
    }
  }

  // 清理缓存
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp.clear();
    console.log('静态数据服务缓存已清理');
  }

  // 获取服务状态
  getStatus() {
    return {
      cacheSize: this.cache.size,
      cachedFiles: Array.from(this.cache.keys()),
      baseUrl: this.BASE_URL,
    };
  }
}

// 导出单例实例
export const staticDataService = new StaticDataService();