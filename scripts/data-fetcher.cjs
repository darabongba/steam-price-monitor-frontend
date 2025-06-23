#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  // 数据源配置
  STEAM_STORE_API: 'https://store.steampowered.com/api',
  STEAMSPY_API: 'https://steamspy.com/api.php',
  STEAMAPI_IO: 'https://api.steamapi.io/steam/applist', // 备用数据源
  
  // 输出配置
  DATA_DIR: path.join(__dirname, '../public/data'),
  CACHE_DIR: path.join(__dirname, '../cache'),
  
  // 防机器人检测配置
  REQUEST_DELAY: 2000, // 请求间隔增加到2秒
  MAX_RETRIES: 5,
  BATCH_SIZE: 5, // 减少批处理大小
  RANDOM_DELAY: true, // 启用随机延迟
  
  // 数据配置
  POPULAR_GAMES_LIMIT: 50, // 减少游戏数量避免过多请求
  MAX_GAMES_PER_CATEGORY: 20,
};

// 用户代理池 - 模拟真实浏览器
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// 随机获取User-Agent
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 获取随机延迟
function getRandomDelay(base = CONFIG.REQUEST_DELAY) {
  if (!CONFIG.RANDOM_DELAY) return base;
  const randomFactor = 0.5 + Math.random(); // 0.5 - 1.5倍
  return Math.floor(base * randomFactor);
}

// HTTP请求工具
class AntiDetectionHttpClient {
  constructor() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.failedAttempts = 0;
    this.sessionHeaders = this.generateSessionHeaders();
  }

  // 生成会话头信息
  generateSessionHeaders() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Connection': 'keep-alive',
    };
  }

  async request(url, options = {}) {
    // 智能延迟
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requiredDelay = getRandomDelay();
    
    if (timeSinceLastRequest < requiredDelay) {
      await this.delay(requiredDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    const userAgent = getRandomUserAgent();
    
    console.log(`[${this.requestCount}] 请求: ${url}`);
    console.log(`使用UA: ${userAgent.slice(0, 50)}...`);

    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Referer': 'https://store.steampowered.com/',
          'Origin': 'https://store.steampowered.com',
          ...this.sessionHeaders,
          ...options.headers
        },
        timeout: 15000, // 增加超时时间
      }, (response) => {
        let data = '';
        
        // 检查状态码
        if (response.statusCode === 429) {
          console.warn('⚠️ 触发速率限制，等待更长时间...');
          reject(new Error('Rate limited'));
          return;
        }
        
        if (response.statusCode === 403) {
          console.warn('⚠️ 访问被拒绝，可能触发机器人检测');
          reject(new Error('Access denied - possible bot detection'));
          return;
        }

        response.on('data', chunk => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            if (response.statusCode === 200) {
              // 检查是否是HTML响应（可能是验证页面）
              if (data.trim().startsWith('<') && url.includes('api')) {
                console.warn('⚠️ 收到HTML响应而非JSON，可能遇到验证页面');
                reject(new Error('Received HTML instead of JSON - possible verification page'));
                return;
              }
              
              const jsonData = JSON.parse(data);
              this.failedAttempts = 0; // 重置失败计数
              resolve(jsonData);
            } else {
              reject(new Error(`HTTP ${response.statusCode}: ${data}`));
            }
          } catch (error) {
            console.error('JSON解析错误:', error.message);
            console.error('响应数据前100字符:', data.slice(0, 100));
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        });
      });

      request.on('error', (error) => {
        this.failedAttempts++;
        reject(error);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async requestWithRetry(url, maxRetries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.request(url);
      } catch (error) {
        console.error(`请求失败 (尝试 ${i + 1}/${maxRetries}):`, error.message);
        
        if (i === maxRetries - 1) throw error;
        
        // 根据错误类型调整等待时间
        let waitTime = Math.pow(2, i) * 1000; // 指数退避
        
        if (error.message.includes('Rate limited')) {
          waitTime = Math.max(waitTime, 60000); // 速率限制至少等待1分钟
        } else if (error.message.includes('bot detection')) {
          waitTime = Math.max(waitTime, 120000); // 机器人检测等待2分钟
          this.sessionHeaders = this.generateSessionHeaders(); // 重新生成会话头
        }
        
        console.log(`等待 ${waitTime/1000} 秒后重试...`);
        await this.delay(waitTime);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 数据获取器 - 多数据源
class SteamDataFetcher {
  constructor() {
    this.client = new AntiDetectionHttpClient();
    this.cache = new Map();
  }

  // 获取热门游戏列表 - 使用多个数据源
  async getPopularGames() {
    console.log('🔥 获取热门游戏列表...');
    
    // 尝试多个数据源
    const dataSources = [
      {
        name: 'SteamSpy',
        fetch: () => this.fetchFromSteamSpy()
      },
      {
        name: 'Steam Store Search',
        fetch: () => this.fetchFromSteamStore()
      },
      {
        name: 'Steam API IO',
        fetch: () => this.fetchFromSteamApiIO()
      }
    ];

    for (const source of dataSources) {
      try {
        console.log(`尝试从 ${source.name} 获取数据...`);
        const games = await source.fetch();
        
        if (games && games.length > 0) {
          console.log(`✅ 从 ${source.name} 成功获取 ${games.length} 个游戏`);
          return games;
        }
      } catch (error) {
        console.error(`❌ ${source.name} 失败:`, error.message);
        continue;
      }
    }

    console.error('❌ 所有数据源都失败了');
    return [];
  }

  // SteamSpy数据源
  async fetchFromSteamSpy() {
    const url = `${CONFIG.STEAMSPY_API}?request=top100in2weeks`;
    const data = await this.client.requestWithRetry(url);
    
    if (!data || typeof data !== 'object') {
      throw new Error('SteamSpy返回无效数据');
    }

    return Object.entries(data)
      .slice(0, CONFIG.POPULAR_GAMES_LIMIT)
      .map(([appid, game]) => ({
        steamId: appid,
        name: game.name || `Game ${appid}`,
        developer: game.developer || '未知开发商',
        publisher: game.publisher || '未知发行商',
        tags: game.tags ? Object.keys(game.tags) : [],
        price: game.price || 0,
        owners: game.owners || '未知',
        averagePlaytime: game.average_forever || 0,
        score: game.score_rank || 0,
        lastUpdated: new Date().toISOString(),
      }));
  }

  // Steam商店搜索数据源
  async fetchFromSteamStore() {
    // 搜索热门关键词获取游戏
    const popularTerms = ['action', 'rpg', 'strategy', 'simulation', 'sports'];
    const games = [];

    for (const term of popularTerms) {
      try {
        const url = `${CONFIG.STEAM_STORE_API}/storesearch/?term=${term}&l=schinese&cc=CN`;
        const response = await this.client.requestWithRetry(url);
        
        if (response && response.items) {
          const termGames = response.items.slice(0, 10).map(item => ({
            steamId: String(item.id),
            name: item.name,
            developer: item.developer || '未知开发商',
            publisher: item.publisher || '未知发行商',
            tags: [],
            price: 0,
            owners: '未知',
            averagePlaytime: 0,
            score: 0,
            lastUpdated: new Date().toISOString(),
          }));
          
          games.push(...termGames);
        }
        
        // 搜索词之间的延迟
        await this.client.delay(getRandomDelay(3000));
        
      } catch (error) {
        console.warn(`搜索词 "${term}" 失败:`, error.message);
        continue;
      }
    }

    // 去重并限制数量
    const uniqueGames = games.filter((game, index, self) => 
      index === self.findIndex(g => g.steamId === game.steamId)
    );

    return uniqueGames.slice(0, CONFIG.POPULAR_GAMES_LIMIT);
  }

  // Steam API IO数据源（备用）
  async fetchFromSteamApiIO() {
    // 这是一个简化的实现，实际可能需要API密钥
    console.log('Steam API IO 数据源暂未实现，跳过...');
    return [];
  }

  // 获取游戏详细信息 - 减少请求频率
  async getGameDetails(steamIds) {
    console.log(`🎮 获取 ${steamIds.length} 个游戏的详细信息...`);
    
    const results = [];
    const limitedIds = steamIds.slice(0, 20); // 限制详情获取数量
    
    // 更小的批次处理
    for (let i = 0; i < limitedIds.length; i += CONFIG.BATCH_SIZE) {
      const batch = limitedIds.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`处理批次 ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(limitedIds.length / CONFIG.BATCH_SIZE)}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(steamId => this.fetchGameDetail(steamId))
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          console.error(`获取游戏 ${batch[index]} 详情失败:`, result.reason?.message);
        }
      });
      
      // 批次间更长延迟
      if (i + CONFIG.BATCH_SIZE < limitedIds.length) {
        const batchDelay = getRandomDelay(5000); // 5-7.5秒随机延迟
        console.log(`批次间等待 ${batchDelay/1000} 秒...`);
        await this.client.delay(batchDelay);
      }
    }
    
    console.log(`✅ 成功获取 ${results.length} 个游戏详情`);
    return results;
  }

  // 获取单个游戏详情
  async fetchGameDetail(steamId) {
    const url = `${CONFIG.STEAM_STORE_API}/appdetails?appids=${steamId}&l=schinese&cc=CN`;
    
    try {
      const data = await this.client.requestWithRetry(url);
      
      if (!data || !data[steamId] || !data[steamId].success) {
        return null;
      }
      
      const gameData = data[steamId].data;
      
      return {
        steamId: steamId,
        name: gameData.name,
        type: gameData.type || 'game',
        description: gameData.short_description || '',
        fullDescription: gameData.detailed_description || '',
        developer: gameData.developers?.[0] || '未知开发商',
        publisher: gameData.publishers?.[0] || '未知发行商',
        releaseDate: gameData.release_date?.date || '',
        comingSoon: gameData.release_date?.coming_soon || false,
        headerImage: gameData.header_image || '',
        screenshots: gameData.screenshots?.slice(0, 5).map(s => s.path_thumbnail) || [],
        movies: gameData.movies?.slice(0, 3).map(m => ({
          id: m.id,
          name: m.name,
          thumbnail: m.thumbnail,
          webm: m.webm?.max || m.webm?.['480']
        })) || [],
        genres: gameData.genres?.map(g => g.description) || [],
        categories: gameData.categories?.slice(0, 10).map(c => c.description) || [],
        platforms: {
          windows: gameData.platforms?.windows || false,
          mac: gameData.platforms?.mac || false,
          linux: gameData.platforms?.linux || false,
        },
        price: gameData.price_overview ? {
          currency: gameData.price_overview.currency,
          initial: gameData.price_overview.initial / 100,
          final: gameData.price_overview.final / 100,
          discount_percent: gameData.price_overview.discount_percent,
          formatted: gameData.price_overview.final_formatted,
        } : null,
        isFree: gameData.is_free || false,
        dlc: gameData.dlc?.slice(0, 10) || [],
        achievements: gameData.achievements?.total || 0,
        metacriticScore: gameData.metacritic?.score,
        recommendations: gameData.recommendations?.total || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`获取游戏 ${steamId} 详情失败:`, error.message);
      return null;
    }
  }

  // 生成模拟价格历史数据
  async getPriceHistory(steamIds) {
    console.log('📈 生成价格历史数据...');
    
    const priceHistory = {};
    const now = new Date();
    
    steamIds.slice(0, 15).forEach(steamId => { // 限制价格历史数量
      const history = [];
      // 生成过去30天的模拟价格数据
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // 模拟价格波动
        const basePrice = Math.random() * 200 + 10;
        const discount = Math.random() > 0.85 ? Math.random() * 0.7 : 0;
        
        history.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(basePrice * (1 - discount) * 100) / 100,
          originalPrice: Math.round(basePrice * 100) / 100,
          discount: Math.round(discount * 100),
        });
      }
      
      priceHistory[steamId] = history;
    });
    
    return priceHistory;
  }

  // 获取游戏搜索索引
  async getSearchIndex(games) {
    console.log('🔍 生成搜索索引...');
    
    return games.map(game => ({
      steamId: game.steamId,
      name: game.name,
      developer: game.developer,
      publisher: game.publisher,
      tags: game.tags || game.genres || [],
      nameWords: game.name.toLowerCase().split(/\s+/),
      searchText: `${game.name} ${game.developer} ${game.publisher}`.toLowerCase(),
    }));
  }

  // 获取统计信息
  getStats() {
    return {
      requestCount: this.client.requestCount,
      failedAttempts: this.client.failedAttempts,
      cacheSize: this.cache.size,
    };
  }
}

// 文件管理器
class FileManager {
  static async ensureDir(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  static async saveJSON(filePath, data) {
    await this.ensureDir(path.dirname(filePath));
    const jsonStr = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonStr, 'utf-8');
    console.log(`数据已保存到: ${filePath}`);
  }

  static async loadJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        exists: true,
      };
    } catch {
      return { exists: false };
    }
  }
}

// Git管理器
class GitManager {
  static async commitAndPush(message) {
    try {
      console.log('提交更改到Git...');
      
      execSync('git add public/data/', { stdio: 'inherit' });
      
      try {
        execSync('git diff --cached --exit-code', { stdio: 'pipe' });
        console.log('没有数据更改，跳过提交');
        return false;
      } catch {
        // 有更改，继续提交
      }
      
      execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log('成功提交并推送到GitHub');
      return true;
    } catch (error) {
      console.error('Git操作失败:', error.message);
      return false;
    }
  }
}

// 主执行函数
async function main() {
  const startTime = Date.now();
  console.log('🚀 开始拉取Steam数据（反机器人检测版本）...');
  console.log('时间:', new Date().toISOString());
  
  try {
    const fetcher = new SteamDataFetcher();
    
    console.log('📋 配置信息:');
    console.log(`- 请求间隔: ${CONFIG.REQUEST_DELAY}ms`);
    console.log(`- 随机延迟: ${CONFIG.RANDOM_DELAY ? '启用' : '禁用'}`);
    console.log(`- 批处理大小: ${CONFIG.BATCH_SIZE}`);
    console.log(`- 热门游戏限制: ${CONFIG.POPULAR_GAMES_LIMIT}`);
    
    // 1. 获取热门游戏列表
    const popularGames = await fetcher.getPopularGames();
    if (popularGames.length === 0) {
      throw new Error('无法获取热门游戏列表');
    }
    
    // 2. 获取游戏详细信息
    const steamIds = popularGames.map(game => game.steamId);
    const gameDetails = await fetcher.getGameDetails(steamIds);
    
    // 3. 获取价格历史（模拟数据）
    const priceHistory = await fetcher.getPriceHistory(steamIds);
    
    // 4. 生成搜索索引
    const searchIndex = await fetcher.getSearchIndex(gameDetails);
    
    // 5. 保存数据文件
    const dataDir = CONFIG.DATA_DIR;
    await FileManager.ensureDir(dataDir);
    
    await Promise.all([
      FileManager.saveJSON(path.join(dataDir, 'popular-games.json'), popularGames),
      FileManager.saveJSON(path.join(dataDir, 'game-details.json'), gameDetails),
      FileManager.saveJSON(path.join(dataDir, 'price-history.json'), priceHistory),
      FileManager.saveJSON(path.join(dataDir, 'search-index.json'), searchIndex),
      FileManager.saveJSON(path.join(dataDir, 'metadata.json'), {
        lastUpdated: new Date().toISOString(),
        gamesCount: gameDetails.length,
        popularGamesCount: popularGames.length,
        priceHistoryCount: Object.keys(priceHistory).length,
        version: '1.1.0',
        dataSource: 'SteamSpy + Steam Store API (Anti-Detection)',
        antiDetectionEnabled: true,
        requestStats: fetcher.getStats(),
      }),
    ]);
    
    // 6. 提交到Git
    const commitMessage = `🤖 自动更新Steam数据（反检测） - ${new Date().toLocaleDateString('zh-CN')} (${gameDetails.length}个游戏)`;
    await GitManager.commitAndPush(commitMessage);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const stats = fetcher.getStats();
    
    console.log('\n✅ 数据拉取和更新完成!');
    console.log(`⏱️  耗时: ${duration}秒`);
    console.log(`📊 统计:`);
    console.log(`  - 游戏详情: ${gameDetails.length}个`);
    console.log(`  - 热门游戏: ${popularGames.length}个`);
    console.log(`  - 总请求数: ${stats.requestCount}`);
    console.log(`  - 失败次数: ${stats.failedAttempts}`);
    console.log(`  - 缓存大小: ${stats.cacheSize}`);
    
  } catch (error) {
    console.error('❌ 数据拉取失败:', error.message);
    
    // 输出故障排除建议
    console.log('\n🔧 故障排除建议:');
    console.log('1. 检查网络连接');
    console.log('2. 验证API是否可访问');
    console.log('3. 等待一段时间后重试（可能触发了速率限制）');
    console.log('4. 考虑使用VPN或代理服务器');
    
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { SteamDataFetcher, FileManager, GitManager }; 