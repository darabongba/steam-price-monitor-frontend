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

  // 获取热门游戏列表
  async getPopularGames(): Promise<Game[]> {
    const games = await this.loadJSON<any[]>('popular-games.json');
    
    return games.map(game => ({
      id: crypto.randomUUID(),
      steamId: game.steamId,
      name: game.name,
      imageUrl: '', // 静态数据中没有图片URL，需要从详情中获取
      headerImage: '',
      description: '',
      shortDescription: '',
      developer: game.developer || '未知开发商',
      publisher: game.publisher || '未知发行商',
      tags: game.tags || [],
      categories: [],
      genres: [],
      releaseDate: '',
      platforms: {
        windows: true,
        mac: false,
        linux: false,
      },
      lastUpdated: new Date(game.lastUpdated || Date.now()),
      createdAt: new Date(),
    }));
  }

  // 获取游戏详情列表
  async getGameDetails(): Promise<GameDetails[]> {
    const details = await this.loadJSON<any[]>('game-details.json');
    
    return details.map(game => ({
      id: crypto.randomUUID(),
      steamId: game.steamId,
      name: game.name,
      imageUrl: game.headerImage || '',
      headerImage: game.headerImage || '',
      description: game.description || '',
      shortDescription: game.description || '',
      developer: game.developer || '未知开发商',
      publisher: game.publisher || '未知发行商',
      tags: game.genres || [],
      categories: game.categories || [],
      genres: game.genres || [],
      releaseDate: game.releaseDate || '',
      platforms: game.platforms || {
        windows: true,
        mac: false,
        linux: false,
      },
      screenshots: game.screenshots || [],
      movies: game.movies || [],
      systemRequirements: {
        minimum: '',
        recommended: '',
      },
      reviews: {
        positive: game.recommendations || 0,
        negative: 0,
        total: game.recommendations || 0,
        score: 0,
      },
      dlc: game.dlc || [],
      achievements: game.achievements || 0,
      metacriticScore: game.metacriticScore,
      steamRating: 0,
      ageRating: '全年龄',
      lastUpdated: new Date(game.lastUpdated || Date.now()),
      createdAt: new Date(),
    }));
  }

  // 获取单个游戏详情
  async getGameDetail(steamId: string): Promise<GameDetails | null> {
    const allDetails = await this.getGameDetails();
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
      const gameDetails = await this.getGameDetails();
      
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
            id: crypto.randomUUID(),
            steamId: result.item.steamId,
            name: result.item.name,
            imageUrl: detail?.headerImage || '',
            headerImage: detail?.headerImage || '',
            description: detail?.description || '',
            shortDescription: detail?.shortDescription || '',
            developer: result.item.developer,
            publisher: result.item.publisher,
            tags: result.item.tags,
            categories: detail?.categories || [],
            genres: detail?.genres || [],
            releaseDate: detail?.releaseDate || '',
            platforms: detail?.platforms || {
              windows: true,
              mac: false,
              linux: false,
            },
            lastUpdated: new Date(),
            createdAt: new Date(),
          };
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
      
      // 从游戏详情中提取价格信息（如果有的话）
      const priceHistory = await this.loadJSON<Record<string, PriceHistoryRecord[]>>('price-history.json');
      const history = priceHistory[steamId];
      
      if (!history || history.length === 0) {
        return {
          steamId,
          price: 0,
          originalPrice: 0,
          discountPercent: 0,
          currency: 'CNY',
          formatted: '价格未知',
          isFree: false,
          onSale: false,
          lastUpdated: new Date(),
        };
      }
      
      // 获取最新的价格记录
      const latestPrice = history[history.length - 1];
      
      return {
        steamId,
        price: latestPrice.price,
        originalPrice: latestPrice.originalPrice,
        discountPercent: latestPrice.discount,
        currency: 'CNY',
        formatted: `¥${latestPrice.price.toFixed(2)}`,
        isFree: latestPrice.price === 0,
        onSale: latestPrice.discount > 0,
        lastUpdated: new Date(),
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