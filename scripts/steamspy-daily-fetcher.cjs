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
  STEAMSPY_API: 'https://steamspy.com/api.php',
  STEAM_STORE_API: 'https://store.steampowered.com/api',
  STEAM_STORE_BASE: 'https://store.steampowered.com',

  // 输出配置
  DATA_DIR: path.join(__dirname, '../public/data'),
  CACHE_DIR: path.join(__dirname, '../cache'),

  // 浏览器配置
  HEADLESS: true,
  VIEWPORT: { width: 1920, height: 1080 },
  PAGE_TIMEOUT: 30000,
  REQUEST_TIMEOUT: 15000,

  // 防检测配置
  REQUEST_DELAY: 3000,
  RANDOM_DELAY: true,
  MAX_RETRIES: 3,
  BATCH_SIZE: 5,

  // 数据配置
  TOTAL_GAMES_LIMIT: 999,        // 总游戏数量限制
  DAILY_DETAILS_LIMIT: 100,      // 每日获取详情数量
  GAMES_PER_PAGE: 50,            // 每页游戏数量（SteamSpy默认）
  MAX_PAGES: 20,                 // 最大页数限制
};

// 进度记录文件
const PROGRESS_FILE = path.join(__dirname, '../cache/steamspy-progress.json');

// 获取随机延迟
function getRandomDelay(base = CONFIG.REQUEST_DELAY) {
  if (!CONFIG.RANDOM_DELAY) return base;
  const randomFactor = 0.7 + Math.random() * 0.6;
  return Math.floor(base * randomFactor);
}

// 延迟函数
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

// 进度管理器
class ProgressManager {
  constructor() {
    this.progress = {
      lastPage: 0,
      lastDetailIndex: 0,
      totalGames: 0,
      totalDetails: 0,
      lastUpdated: null,
      dailyDetailsCount: 0,
      lastDailyReset: null,
    };
  }

  async load() {
    try {
      const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
      this.progress = { ...this.progress, ...JSON.parse(data) };
      console.log('📖 加载进度记录:', this.progress);
    } catch (error) {
      console.log('📝 未找到进度记录，将创建新记录');
      await this.save();
    }
  }

  async save() {
    try {
      await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.error('保存进度记录失败:', error.message);
    }
  }

  shouldResetDaily() {
    const today = new Date().toDateString();
    if (this.progress.lastDailyReset !== today) {
      this.progress.lastDailyReset = today;
      this.progress.dailyDetailsCount = 0;
      return true;
    }
    return false;
  }

  canFetchMoreDetails() {
    return this.progress.dailyDetailsCount < CONFIG.DAILY_DETAILS_LIMIT;
  }

  incrementDailyDetails() {
    this.progress.dailyDetailsCount++;
  }

  updatePageProgress(page) {
    this.progress.lastPage = page;
  }

  updateDetailProgress(index) {
    this.progress.lastDetailIndex = index;
    this.progress.totalDetails++;
  }

  updateTotalGames(count) {
    this.progress.totalGames = count;
  }
}

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

    if (CONFIG.PROXY_SERVER) {
      args.push(`--proxy-server=${CONFIG.PROXY_SERVER}`);
      console.log(`📡 使用代理: ${CONFIG.PROXY_SERVER}`);
    } else {
      console.log('📡 直接连接（无代理）');
    }

    this.browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: args,
      defaultViewport: CONFIG.VIEWPORT,
      timeout: CONFIG.PAGE_TIMEOUT,
    });

    this.page = await this.browser.newPage();

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

    await this.page.setRequestInterception(true);

    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    this.page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        console.warn(`⚠️ HTTP ${status}: ${response.url()}`);
        this.failedRequests++;
      }
    });

    console.log('✅ Puppeteer浏览器初始化完成');
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
      const text = await response.text();

      if (contentType.includes('application/json')) {
        return JSON.parse(text);
      } else if (contentType.includes('text/html')) {
        if (text.includes('security check') || text.includes('robot') || text.includes('verification')) {
          throw new Error('检测到验证页面，可能遇到机器人检测');
        }
        throw new Error('收到HTML响应而非JSON数据');
      } else {
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

        let waitTime = Math.pow(2, i) * 2000;

        if (error.message.includes('机器人检测') || error.message.includes('验证页面')) {
          waitTime = Math.max(waitTime, 60000);
          console.log('🔄 检测到机器人验证，等待恢复...');
        } else if (error.message.includes('timeout')) {
          waitTime = Math.max(waitTime, 10000);
        }

        console.log(`⏳ 等待 ${waitTime/1000} 秒后重试...`);
        await delay(waitTime);
      }
    }
  }

  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
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

// SteamSpy数据获取器
class SteamSpyDataFetcher {
  constructor() {
    this.browser = new PuppeteerBrowserManager();
    this.progress = new ProgressManager();
  }

  async init() {
    await this.browser.init();
    await this.progress.load();
  }

  async loadExistingData() {
    try {
      const gamesFile = path.join(CONFIG.DATA_DIR, 'steamspy-games.json');
      const detailsFile = path.join(CONFIG.DATA_DIR, 'game-details.json');

      const games = await fs.readFile(gamesFile, 'utf-8').then(JSON.parse).catch(() => []);
      const details = await fs.readFile(detailsFile, 'utf-8').then(JSON.parse).catch(() => []);

      console.log(`📖 加载现有数据: ${games.length} 个游戏, ${details.length} 个详情`);
      return { games, details };
    } catch (error) {
      console.log('📝 未找到现有数据文件，将创建新文件');
      return { games: [], details: [] };
    }
  }

  async fetchGamesFromPage(page) {
    console.log(`📄 获取第 ${page} 页游戏数据...`);

    const url =
        `${CONFIG.STEAMSPY_API}?request=all&page=${page}`;
    const data = await this.browser.fetchAPIWithRetry(url);

    if (!data || typeof data !== 'object') {
      throw new Error('SteamSpy返回无效数据');
    }

    const games = Object.entries(data).map(([appid, game]) => ({
      steamId: appid,
      name: game.name || `Game ${appid}`,
      developer: game.developer || '未知开发商',
      publisher: game.publisher || '未知发行商',
      tags: game.tags ? Object.keys(game.tags).slice(0, 10) : [],
      price: game.price || 0,
      owners: game.owners || '未知',
      averagePlaytime: game.average_forever || 0,
      score: game.score_rank || 0,
      page: page,
      lastUpdated: new Date().toLocaleString(),
    }));

    console.log(`✅ 第 ${page} 页获取 ${games.length} 个游戏`);
    return games;
  }

  async fetchAllGames() {
    console.log('🎮 开始获取SteamSpy游戏数据...');

    const { games: existingGames } = await this.loadExistingData();
    const allGames = [...existingGames];

    // 从上次的页数开始获取
    let currentPage = this.progress.progress.lastPage;
    let totalFetched = existingGames.length;

    while (totalFetched < CONFIG.TOTAL_GAMES_LIMIT && currentPage < CONFIG.MAX_PAGES) {
      try {
        const pageGames = await this.fetchGamesFromPage(currentPage);

        if (pageGames.length === 0) {
          console.log(`⚠️ 第 ${currentPage} 页无数据，停止获取`);
          break;
        }

        // 去重并添加新游戏
        const newGames = pageGames.filter(newGame =>
          !allGames.some(existingGame => existingGame.steamId === newGame.steamId)
        );

        allGames.push(...newGames);
        totalFetched = allGames.length;

        console.log(`📊 当前总计: ${totalFetched} 个游戏 (新增 ${newGames.length} 个)`);

        this.progress.updatePageProgress(currentPage);
        await this.progress.save();

        currentPage++;

        // 页面间延迟
        if (totalFetched < CONFIG.TOTAL_GAMES_LIMIT) {
          const pageDelay = getRandomDelay(5000);
          console.log(`⏳ 页面间等待 ${pageDelay/1000} 秒...`);
          await delay(pageDelay);
        }

      } catch (error) {
        console.error(`❌ 获取第 ${currentPage} 页失败:`, error.message);
        break;
      }
    }

    this.progress.updateTotalGames(allGames.length);
    await this.progress.save();

    console.log(`✅ 游戏数据获取完成: ${allGames.length} 个游戏`);
    return allGames;
  }

  async fetchGameDetails(steamIds) {
    console.log(`🎯 获取 ${steamIds.length} 个游戏的详细信息...`);

    const { details: existingDetails } = await this.loadExistingData();
    const detailsMap = new Map(existingDetails.map(d => [d.steamId, d]));
    const newDetails = [];

    let processedCount = 0;

    for (const steamId of steamIds) {
      // 检查是否已达到每日限制
      if (!this.progress.canFetchMoreDetails()) {
        console.log(`⏸️ 已达到每日详情获取限制 (${CONFIG.DAILY_DETAILS_LIMIT})`);
        break;
      }

      // 跳过已存在的详情
      if (detailsMap.has(steamId)) {
        console.log(`⏭️ 跳过已存在的游戏详情: ${steamId}`);
        continue;
      }

      try {
        const gameDetail = await this.fetchGameDetail(steamId);
        if (gameDetail) {
          detailsMap.set(steamId, gameDetail);
          newDetails.push(gameDetail);
          this.progress.incrementDailyDetails();
          processedCount++;

          console.log(`✅ 获取游戏详情: ${gameDetail.name} (${processedCount}/${steamIds.length})`);
        }
      } catch (error) {
        console.error(`❌ 获取游戏 ${steamId} 详情失败:`, error.message);
      }

      // 详情间延迟
      if (processedCount < steamIds.length && this.progress.canFetchMoreDetails()) {
        const detailDelay = getRandomDelay(3000);
        console.log(`⏳ 详情间等待 ${detailDelay/1000} 秒...`);
        await delay(detailDelay);
      }
    }

    const allDetails = Array.from(detailsMap.values());
    console.log(`✅ 详情获取完成: 新增 ${newDetails.length} 个，总计 ${allDetails.length} 个`);

    return allDetails;
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

  async getNextDetailsBatch() {
    const { games } = await this.loadExistingData();

    if (games.length === 0) {
      console.log('⚠️ 没有游戏数据，无法获取详情');
      return [];
    }

    // 从上次的位置开始，获取下一批需要详情的游戏
    const startIndex = this.progress.progress.lastDetailIndex;
    const endIndex = Math.min(startIndex + CONFIG.DAILY_DETAILS_LIMIT, games.length);

    const batch = games.slice(startIndex, endIndex);
    console.log(`📋 准备获取详情批次: ${startIndex + 1}-${endIndex} (共 ${batch.length} 个)`);

    return batch.map(game => game.steamId);
  }

  async saveData(games, details) {
    console.log('💾 保存数据文件...');

    await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });

    await Promise.all([
      fs.writeFile(
        path.join(CONFIG.DATA_DIR, 'steamspy-games.json'),
        JSON.stringify(games, null, 2)
      ),
      fs.writeFile(
        path.join(CONFIG.DATA_DIR, 'game-details.json'),
        JSON.stringify(details, null, 2)
      ),
      fs.writeFile(
        path.join(CONFIG.DATA_DIR, 'steamspy-metadata.json'),
        JSON.stringify({
          lastUpdated: new Date().toLocaleString(),
          totalGames: games.length,
          totalDetails: details.length,
          lastPage: this.progress.progress.lastPage,
          lastDetailIndex: this.progress.progress.lastDetailIndex,
          dailyDetailsCount: this.progress.progress.dailyDetailsCount,
          version: '1.0.0',
          dataSource: 'SteamSpy + Steam Store',
          mode: 'daily-incremental',
        }, null, 2)
      ),
    ]);

    console.log('✅ 数据文件保存完成');
  }

  async close() {
    await this.browser.close();
  }

  getStats() {
    const browserStats = this.browser.getStats();
    return {
      ...browserStats,
      progress: this.progress.progress,
      mode: 'SteamSpy Daily Fetcher',
    };
  }
}

// 主执行函数
async function main() {
  const startTime = Date.now();
  console.log('🚀 开始SteamSpy每日数据获取...');
  console.log('时间:', new Date().toLocaleString());

  let fetcher;

  try {
    fetcher = new SteamSpyDataFetcher();
    await fetcher.init();

    console.log('📋 配置信息:');
    console.log(`- 代理服务器: ${CONFIG.PROXY_SERVER || '无'}`);
    console.log(`- 总游戏限制: ${CONFIG.TOTAL_GAMES_LIMIT}`);
    console.log(`- 每日详情限制: ${CONFIG.DAILY_DETAILS_LIMIT}`);
    console.log(`- 批处理大小: ${CONFIG.BATCH_SIZE}`);

    // 检查是否需要重置每日计数
    if (fetcher.progress.shouldResetDaily()) {
      console.log('🔄 新的一天，重置每日详情计数');
    }

    // 1. 获取游戏列表
    const games = await fetcher.fetchAllGames();

    // 2. 获取下一批详情
    const detailSteamIds = await fetcher.getNextDetailsBatch();
    let details = [];

    if (detailSteamIds.length > 0) {
      details = await fetcher.fetchGameDetails(detailSteamIds);
    }

    // 3. 保存数据
    await fetcher.saveData(games, details);

    // 4. 提交到Git
    const commitMessage = `🤖 SteamSpy每日数据更新 - ${new Date().toLocaleDateString('zh-CN')} (游戏:${games.length}, 详情:${details.length})`;

    try {
      execSync('git add public/data/ cache/', { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ 成功提交并推送到GitHub');
    } catch (error) {
      console.warn('⚠️ Git操作失败:', error.message);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const stats = fetcher.getStats();

    console.log('\n✅ SteamSpy数据获取完成!');
    console.log(`⏱️  耗时: ${duration}秒`);
    console.log(`📊 统计:`);
    console.log(`  - 游戏总数: ${games.length}`);
    console.log(`  - 详情总数: ${details.length}`);
    console.log(`  - 当前页数: ${stats.progress.lastPage}`);
    console.log(`  - 每日详情: ${stats.progress.dailyDetailsCount}/${CONFIG.DAILY_DETAILS_LIMIT}`);
    console.log(`  - 总请求数: ${stats.requestCount}`);
    console.log(`  - 失败次数: ${stats.failedRequests}`);
    console.log(`  - 成功率: ${(stats.successRate * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ SteamSpy数据获取失败:', error.message);
    process.exit(1);

  } finally {
    if (fetcher) {
      await fetcher.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { SteamSpyDataFetcher, ProgressManager };
