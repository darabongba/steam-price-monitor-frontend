#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// 检查puppeteer是否安装
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer 未安装，请先运行: npm install puppeteer');
  process.exit(1);
}

// 配置
const CONFIG = {
  // 代理配置 - 在CI环境下禁用
  PROXY_SERVER: process.env.NO_PROXY ? null : 'http://127.0.0.1:7890',
  
  // 数据源配置
  STEAM_STORE_API: 'https://store.steampowered.com/api',
  STEAMSPY_API: 'https://steamspy.com/api.php',
  STEAM_STORE_BASE: 'https://store.steampowered.com',
  
  // 输出配置
  DATA_DIR: path.join(__dirname, '../public/data'),
  CACHE_DIR: path.join(__dirname, '../cache'),
  
  // 浏览器配置
  HEADLESS: true,              // 无头模式
  VIEWPORT: { width: 1920, height: 1080 },
  PAGE_TIMEOUT: 30000,         // 页面超时30秒
  REQUEST_TIMEOUT: 15000,      // 请求超时15秒
  
  // 防检测配置
  REQUEST_DELAY: 3000,         // 请求间隔3秒
  RANDOM_DELAY: true,          // 启用随机延迟
  MAX_RETRIES: 3,              // 最大重试次数
  BATCH_SIZE: 3,               // 批处理大小
  
  // 数据配置
  POPULAR_GAMES_LIMIT: 1000,     // 热门游戏数量（Puppeteer模式下减少）
  MAX_GAMES_PER_CATEGORY: 15,  // 每类别游戏数量
};

// 获取随机延迟
function getRandomDelay(base = CONFIG.REQUEST_DELAY) {
  if (!CONFIG.RANDOM_DELAY) return base;
  const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 - 1.3倍
  return Math.floor(base * randomFactor);
}

// 手写Promise延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 随机用户代理
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
];

// Puppeteer浏览器管理器
class PuppeteerBrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
    this.requestCount = 0;
    this.failedRequests = 0;
  }

  async init() {
    console.log('🚀 启动Puppeteer浏览器...');
    if (CONFIG.PROXY_SERVER) {
      console.log(`📡 使用代理: ${CONFIG.PROXY_SERVER}`);
    } else {
      console.log('📡 直接连接（无代理）');
    }
    
    // 构建浏览器参数
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--user-agent=' + USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    ];
    
    // 如果有代理服务器，添加代理参数
    if (CONFIG.PROXY_SERVER) {
      args.push(`--proxy-server=${CONFIG.PROXY_SERVER}`);
    }
    
    // 启动浏览器
    this.browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: args,
      defaultViewport: CONFIG.VIEWPORT,
      timeout: CONFIG.PAGE_TIMEOUT,
    });

    // 创建页面
    this.page = await this.browser.newPage();
    
    // 设置额外的请求头
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    });

    // 设置请求拦截器
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      // 阻止图片、字体、样式等资源加载（提高速度）
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // 设置响应监听器
    this.page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        console.warn(`⚠️ HTTP ${status}: ${response.url()}`);
        this.failedRequests++;
      }
    });

    console.log('✅ Puppeteer浏览器初始化完成');
  }

  async navigateToSteam() {
    console.log('🌐 访问Steam首页进行"热身"...');
    
    try {
      await this.page.goto(CONFIG.STEAM_STORE_BASE, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.PAGE_TIMEOUT,
      });
      
      // 等待页面加载完成
      await delay(2000);
      
      // 模拟用户行为：滚动页面
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      
      await delay(1000);
      
      console.log('✅ Steam首页访问成功');
      return true;
      
    } catch (error) {
      console.error('❌ Steam首页访问失败:', error.message);
      return false;
    }
  }

  async fetchAPI(url, options = {}) {
    const requestDelay = getRandomDelay();
    console.log(`[${++this.requestCount}] 等待 ${requestDelay}ms 后请求: ${url}`);
    
    await delay(requestDelay);
    
    try {
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.REQUEST_TIMEOUT,
      });
      
      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }
      
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        const text = await response.text();
        return JSON.parse(text);
      } else if (contentType.includes('text/html')) {
        // 检查是否是验证页面
        const text = await response.text();
        if (text.includes('security check') || text.includes('robot') || text.includes('verification')) {
          throw new Error('检测到验证页面，可能遇到机器人检测');
        }
        throw new Error('收到HTML响应而非JSON数据');
      } else {
        const text = await response.text();
        return JSON.parse(text);
      }
      
    } catch (error) {
      this.failedRequests++;
      throw error;
    }
  }

  async fetchAPIWithRetry(url, maxRetries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.fetchAPI(url);
      } catch (error) {
        console.error(`请求失败 (尝试 ${i + 1}/${maxRetries}):`, error.message);
        
        if (i === maxRetries - 1) throw error;
        
        // 根据错误类型调整等待时间
        let waitTime = Math.pow(2, i) * 2000; // 指数退避，基础2秒
        
        if (error.message.includes('机器人检测') || error.message.includes('验证页面')) {
          waitTime = Math.max(waitTime, 60000); // 机器人检测等待1分钟
          console.log('🔄 检测到机器人验证，重新访问Steam首页...');
          await this.navigateToSteam();
        } else if (error.message.includes('timeout')) {
          waitTime = Math.max(waitTime, 10000); // 超时等待10秒
        }
        
        console.log(`⏳ 等待 ${waitTime/1000} 秒后重试...`);
        await delay(waitTime);
      }
    }
  }

  async close() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🔚 Puppeteer浏览器已关闭');
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      failedRequests: this.failedRequests,
      successRate: this.requestCount > 0 ? (this.requestCount - this.failedRequests) / this.requestCount : 0,
    };
  }
}

// Steam数据获取器（Puppeteer版本）
class SteamDataFetcherPuppeteer {
  constructor() {
    this.browser = new PuppeteerBrowserManager();
    this.cache = new Map();
  }

  async init() {
    await this.browser.init();
    // 先访问Steam首页进行"热身"
    await this.browser.navigateToSteam();
  }

  async getPopularGames() {
    console.log('🔥 获取热门游戏列表...');
    
    try {
      // 使用SteamSpy API获取热门游戏
      const url = `${CONFIG.STEAMSPY_API}?request=top100in2weeks`;
      const data = await this.browser.fetchAPIWithRetry(url);
      
      if (!data || typeof data !== 'object') {
        throw new Error('SteamSpy返回无效数据');
      }

      const games = Object.entries(data)
        .slice(0, CONFIG.POPULAR_GAMES_LIMIT)
        .map(([appid, game]) => ({
          steamId: appid,
          name: game.name || `Game ${appid}`,
          developer: game.developer || '未知开发商',
          publisher: game.publisher || '未知发行商',
          tags: game.tags ? Object.keys(game.tags).slice(0, 10) : [],
          price: game.price || 0,
          owners: game.owners || '未知',
          averagePlaytime: game.average_forever || 0,
          score: game.score_rank || 0,
          lastUpdated: new Date().toLocaleString(),
        }));

      console.log(`✅ 成功获取 ${games.length} 个热门游戏`);
      return games;
      
    } catch (error) {
      console.error('❌ 获取热门游戏失败:', error.message);
      
      // 尝试备用方案：通过Steam商店搜索
      console.log('🔄 尝试备用方案...');
      return await this.getPopularGamesFromStore();
    }
  }

  async getGamesByPage(page) {
    console.log('🔥 获取热门游戏列表...');
    
    try {
      // 使用SteamSpy API获取热门游戏
      const url = `${CONFIG.STEAMSPY_API}?request=all&page=${page}`;
      const data = await this.browser.fetchAPIWithRetry(url);
      
      if (!data || typeof data !== 'object') {
        throw new Error('SteamSpy返回无效数据');
      }

      const games = Object.entries(data)
        .slice(0, CONFIG.POPULAR_GAMES_LIMIT)
        .map(([appid, game]) => ({
          steamId: appid,
          name: game.name || `Game ${appid}`,
          developer: game.developer || '未知开发商',
          publisher: game.publisher || '未知发行商',
          tags: game.tags ? Object.keys(game.tags).slice(0, 10) : [],
          price: game.price || 0,
          owners: game.owners || '未知',
          averagePlaytime: game.average_forever || 0,
          score: game.score_rank || 0,
          lastUpdated: new Date().toLocaleString(),
        }));

      console.log(`✅ 成功获取 ${games.length} 个热门游戏`);
      return games;
      
    } catch (error) {
      console.error('❌ 获取热门游戏失败:', error.message);
      
      // 尝试备用方案：通过Steam商店搜索
      console.log('🔄 尝试备用方案...');
      return await this.getPopularGamesFromStore();
    }
  }

  async getPopularGamesFromStore() {
    console.log('🔍 从Steam商店搜索获取热门游戏...');
    
    const games = [];
    const categories = ['action', 'rpg', 'strategy', 'simulation', 'sports'];
    
    for (const category of categories) {
      try {
        const searchUrl = `${CONFIG.STEAM_STORE_BASE}/search/?term=${category}&category1=998&supportedlang=schinese&ndl=1`;
        
        // 使用Puppeteer导航到搜索页面
        await this.browser.page.goto(searchUrl, {
          waitUntil: 'networkidle2',
          timeout: CONFIG.PAGE_TIMEOUT,
        });
        
        // 等待搜索结果加载
        await this.browser.page.waitForSelector('#search_resultsRows', { timeout: 10000 });
        
        // 提取游戏信息
        const categoryGames = await this.browser.page.evaluate(() => {
          const gameElements = document.querySelectorAll('#search_resultsRows .search_result_row');
          const games = [];
          
          for (let i = 0; i < Math.min(gameElements.length, 5); i++) {
            const element = gameElements[i];
            const steamId = element.getAttribute('data-ds-appid');
            const nameElement = element.querySelector('.title');
            
            if (steamId && nameElement) {
              games.push({
                steamId: steamId,
                name: nameElement.textContent.trim(),
                developer: '未知开发商',
                publisher: '未知发行商',
                tags: [],
                price: 0,
                owners: '未知',
                averagePlaytime: 0,
                score: 0,
                lastUpdated: new Date().toLocaleString(),
              });
            }
          }
          
          return games;
        });
        
        games.push(...categoryGames);
        console.log(`✅ 从"${category}"类别获取 ${categoryGames.length} 个游戏`);
        
        // 类别间延迟
        await delay(getRandomDelay(2000));
        
      } catch (error) {
        console.warn(`⚠️ 搜索类别"${category}"失败:`, error.message);
        continue;
      }
    }
    
    // 去重
    const uniqueGames = games.filter((game, index, self) => 
      index === self.findIndex(g => g.steamId === game.steamId)
    );
    
    console.log(`✅ 备用方案获取 ${uniqueGames.length} 个游戏`);
    return uniqueGames.slice(0, CONFIG.POPULAR_GAMES_LIMIT);
  }

  async getGameDetails(steamIds) {
    console.log(`🎮 获取 ${steamIds.length} 个游戏的详细信息...`);
    
    const results = [];
    const limitedIds = steamIds.slice(0, 1000); // Puppeteer模式下限制更多
    
    // 小批次处理
    for (let i = 0; i < limitedIds.length; i += CONFIG.BATCH_SIZE) {
      const batch = limitedIds.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(`处理批次 ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(limitedIds.length / CONFIG.BATCH_SIZE)}`);
      
      for (const steamId of batch) {
        try {
          const gameDetail = await this.fetchGameDetail(steamId);
          if (gameDetail) {
            results.push(gameDetail);
          }
        } catch (error) {
          console.error(`获取游戏 ${steamId} 详情失败:`, error.message);
        }
      }
      
      // 批次间延迟
      if (i + CONFIG.BATCH_SIZE < limitedIds.length) {
        const batchDelay = getRandomDelay(5000);
        console.log(`批次间等待 ${batchDelay/1000} 秒...`);
        await delay(batchDelay);
      }
    }
    
    console.log(`✅ 成功获取 ${results.length} 个游戏详情`);
    return results;
  }

  async fetchGameDetail(steamId) {
    const url = `${CONFIG.STEAM_STORE_API}/appdetails?appids=${steamId}&l=schinese&cc=CN`;
    
    try {
      const data = await this.browser.fetchAPIWithRetry(url);
      
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
        screenshots: gameData.screenshots?.slice(0, 3).map(s => s.path_thumbnail) || [],
        movies: gameData.movies?.slice(0, 2).map(m => ({
          id: m.id,
          name: m.name,
          thumbnail: m.thumbnail,
          webm: m.webm?.max || m.webm?.['480']
        })) || [],
        genres: gameData.genres?.map(g => g.description) || [],
        categories: gameData.categories?.slice(0, 8).map(c => c.description) || [],
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
        dlc: gameData.dlc?.slice(0, 5) || [],
        achievements: gameData.achievements?.total || 0,
        metacriticScore: gameData.metacritic?.score,
        recommendations: gameData.recommendations?.total || 0,
        lastUpdated: new Date().toLocaleString(),
      };
      
    } catch (error) {
      console.error(`获取游戏 ${steamId} 详情失败:`, error.message);
      return null;
    }
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

  async close() {
    await this.browser.close();
  }

  getStats() {
    const browserStats = this.browser.getStats();
    return {
      ...browserStats,
      cacheSize: this.cache.size,
      mode: 'Puppeteer + Proxy',
    };
  }
}

// 文件管理器（复用）
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
}

// Git管理器（复用）
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
  console.log('🚀 开始拉取Steam数据（Puppeteer + 代理版本）...');
  console.log('时间:', new Date().toLocaleString());
  
  let fetcher;
  
  try {
    fetcher = new SteamDataFetcherPuppeteer();
    await fetcher.init();
    
    console.log('📋 配置信息:');
    console.log(`- 代理服务器: ${CONFIG.PROXY_SERVER}`);
    console.log(`- 无头模式: ${CONFIG.HEADLESS ? '启用' : '禁用'}`);
    console.log(`- 请求间隔: ${CONFIG.REQUEST_DELAY}ms`);
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
    
    
    // 4. 生成搜索索引
    const searchIndex = await fetcher.getSearchIndex(gameDetails);
    
    // 5. 保存数据文件
    const dataDir = CONFIG.DATA_DIR;
    await FileManager.ensureDir(dataDir);
    
    await Promise.all([
      FileManager.saveJSON(path.join(dataDir, 'popular-games.json'), popularGames),
      FileManager.saveJSON(path.join(dataDir, 'game-details.json'), gameDetails),
      FileManager.saveJSON(path.join(dataDir, 'search-index.json'), searchIndex),
      FileManager.saveJSON(path.join(dataDir, 'metadata.json'), {
        lastUpdated: new Date().toLocaleString(),
        gamesCount: gameDetails.length,
        popularGamesCount: popularGames.length,
        version: '2.0.0',
        dataSource: 'SteamSpy + Steam Store (Puppeteer + Proxy)',
        mode: 'puppeteer',
        proxyEnabled: true,
        requestStats: fetcher.getStats(),
      }),
    ]);
    
    // 6. 提交到Git
    const commitMessage = `🤖 自动更新Steam数据（Puppeteer+代理） - ${new Date().toLocaleDateString('zh-CN')} (${gameDetails.length}个游戏)`;
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
    console.log(`  - 失败次数: ${stats.failedRequests}`);
    console.log(`  - 成功率: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`  - 模式: ${stats.mode}`);
    
  } catch (error) {
    console.error('❌ 数据拉取失败:', error.message);
    
    // 输出故障排除建议
    console.log('\n🔧 Puppeteer + 代理故障排除:');
    console.log('1. 检查代理服务器是否正常运行 (http://127.0.0.1:7890)');
    console.log('2. 验证代理设置是否正确');
    console.log('3. 检查网络连接和防火墙设置');
    console.log('4. 确保有足够的系统资源运行Puppeteer');
    console.log('5. 如果是服务器环境，可能需要安装额外的依赖');
    
    process.exit(1);
    
  } finally {
    // 确保浏览器关闭
    if (fetcher) {
      await fetcher.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { SteamDataFetcherPuppeteer, FileManager, GitManager }; 