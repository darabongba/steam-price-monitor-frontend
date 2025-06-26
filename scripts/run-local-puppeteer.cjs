#!/usr/bin/env node

const { SteamDataFetcherPuppeteer, FileManager } = require('./data-fetcher-puppeteer.cjs');
const path = require('path');

async function testPuppeteerDataFetching() {
  console.log('🧪 开始本地测试数据拉取（Puppeteer + 代理版本）...');
  console.log('⚠️  这是本地测试，不会提交到Git');
  console.log('📡 使用代理: http://127.0.0.1:7890');
  
  const startTime = Date.now();
  let fetcher;
  
  try {
    // 检查代理连接
    console.log('\n🔗 检查代理连接...');
    console.log('请确保代理服务器 http://127.0.0.1:7890 正在运行');
    console.log('（如Clash、V2Ray、Shadowsocks等）');
    
    fetcher = new SteamDataFetcherPuppeteer();
    await fetcher.init();
    
    console.log('\n📋 测试配置:');
    console.log('- 仅获取前5个游戏详情');
    console.log('- 跳过Git提交');
    console.log('- 数据保存到本地目录');
    console.log('- 使用Puppeteer浏览器模拟');
    
    // 1. 测试获取热门游戏
    console.log('\n=== 第1步: 测试热门游戏获取 ===');
    const popularGames = await fetcher.getPopularGames();
    
    if (popularGames.length === 0) {
      throw new Error('无法获取任何热门游戏数据');
    }
    
    console.log(`✅ 成功获取 ${popularGames.length} 个热门游戏`);
    console.log('前3个游戏:');
    popularGames.slice(0, 3).forEach((game, index) => {
      console.log(`  ${index + 1}. ${game.name} (ID: ${game.steamId})`);
    });
    
    // 2. 测试获取游戏详情（限制数量）
    console.log('\n=== 第2步: 测试游戏详情获取 ===');
    const testIds = popularGames.slice(0, 3).map(g => g.steamId); // 只测试前3个
    const gameDetails = await fetcher.getGameDetails(testIds);
    
    console.log(`✅ 成功获取 ${gameDetails.length} 个游戏详情`);
    if (gameDetails.length > 0) {
      const sample = gameDetails[0];
      console.log('样本游戏详情:');
      console.log(`  - 名称: ${sample.name}`);
      console.log(`  - 开发商: ${sample.developer}`);
      console.log(`  - 类型: ${sample.genres.join(', ')}`);
      console.log(`  - 价格: ${sample.price ? `¥${sample.price.final}` : '免费'}`);
      console.log(`  - 描述: ${sample.description.slice(0, 100)}...`);
    }
    
    // 3. 测试价格历史生成
    console.log('\n=== 第3步: 测试价格历史生成 ===');
    const priceHistory = await fetcher.getPriceHistory(testIds);
    const historyCount = Object.keys(priceHistory).length;
    console.log(`✅ 生成了 ${historyCount} 个游戏的价格历史`);
    
    // 4. 测试搜索索引生成
    console.log('\n=== 第4步: 测试搜索索引生成 ===');
    const searchIndex = await fetcher.getSearchIndex(gameDetails);
    console.log(`✅ 生成了 ${searchIndex.length} 个游戏的搜索索引`);
    
    // 5. 保存测试数据
    console.log('\n=== 第5步: 保存测试数据 ===');
    const testDataDir = path.join(__dirname, '../public/data');
    
    await Promise.all([
      FileManager.saveJSON(path.join(testDataDir, 'popular-games.json'), popularGames),
      FileManager.saveJSON(path.join(testDataDir, 'game-details.json'), gameDetails),
      FileManager.saveJSON(path.join(testDataDir, 'price-history.json'), priceHistory),
      FileManager.saveJSON(path.join(testDataDir, 'search-index.json'), searchIndex),
      FileManager.saveJSON(path.join(testDataDir, 'metadata.json'), {
        lastUpdated: new Date().toLocaleString(),
        gamesCount: gameDetails.length,
        popularGamesCount: popularGames.length,
        priceHistoryCount: Object.keys(priceHistory).length,
        version: '2.0.0-test',
        dataSource: 'SteamSpy + Steam Store (Puppeteer + Proxy Test)',
        isTestData: true,
        testLimited: true,
        mode: 'puppeteer',
        proxyEnabled: true,
        requestStats: fetcher.getStats(),
      }),
    ]);
    
    // 6. 显示测试结果
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const stats = fetcher.getStats();
    
    console.log('\n🎉 Puppeteer本地测试完成!');
    console.log('========================================');
    console.log(`⏱️  总耗时: ${duration}秒`);
    console.log(`📊 数据统计:`);
    console.log(`   - 热门游戏: ${popularGames.length} 个`);
    console.log(`   - 游戏详情: ${gameDetails.length} 个`);
    console.log(`   - 价格历史: ${historyCount} 个`);
    console.log(`   - 搜索索引: ${searchIndex.length} 个`);
    console.log(`🌐 Puppeteer统计:`);
    console.log(`   - 总请求数: ${stats.requestCount}`);
    console.log(`   - 失败次数: ${stats.failedRequests}`);
    console.log(`   - 成功率: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   - 模式: ${stats.mode}`);
    console.log(`   - 平均请求时间: ${Math.round(duration * 1000 / stats.requestCount)}ms`);
    
    // 检查数据质量
    console.log(`\n🔍 数据质量检查:`);
    const gamesWithDetails = gameDetails.filter(g => g.description && g.developer !== '未知开发商');
    const gamesWithPrices = gameDetails.filter(g => g.price);
    const gamesWithImages = gameDetails.filter(g => g.headerImage);
    
    if (gameDetails.length > 0) {
      console.log(`   - 有描述的游戏: ${gamesWithDetails.length}/${gameDetails.length} (${Math.round(gamesWithDetails.length/gameDetails.length*100)}%)`);
      console.log(`   - 有价格的游戏: ${gamesWithPrices.length}/${gameDetails.length} (${Math.round(gamesWithPrices.length/gameDetails.length*100)}%)`);
      console.log(`   - 有图片的游戏: ${gamesWithImages.length}/${gameDetails.length} (${Math.round(gamesWithImages.length/gameDetails.length*100)}%)`);
    }
    
    // 代理和Puppeteer状态检查
    console.log(`\n🔧 技术状态检查:`);
    if (stats.successRate >= 0.8) {
      console.log('   ✅ 代理连接正常');
      console.log('   ✅ Puppeteer浏览器工作正常');
      console.log('   ✅ 反机器人检测效果良好');
    } else if (stats.successRate >= 0.5) {
      console.log('   ⚠️  代理连接存在问题，部分请求失败');
      console.log('   💡 建议检查代理服务器状态');
    } else {
      console.log('   ❌ 严重问题：大部分请求失败');
      console.log('   🔧 请检查代理服务器和网络连接');
    }
    
    if (stats.failedRequests > 0) {
      console.log(`\n⚠️  注意: 有 ${stats.failedRequests} 次请求失败`);
      if (stats.failedRequests / stats.requestCount > 0.3) {
        console.log('   失败率较高，可能的原因:');
        console.log('   1. 代理服务器不稳定');
        console.log('   2. 网络连接问题');
        console.log('   3. Steam API临时限制');
        console.log('   4. 代理被Steam检测');
      }
    }
    
    console.log('\n✅ 测试数据已保存到 public/data/ 目录');
    console.log('💡 如果测试成功且成功率 > 80%，可以运行完整版本');
    console.log('🚀 运行完整版本: node scripts/data-fetcher-puppeteer.cjs');
    
  } catch (error) {
    console.error('\n❌ Puppeteer测试失败:', error.message);
    
    // 详细的错误诊断
    if (error.message.includes('Puppeteer')) {
      console.log('\n🔧 Puppeteer相关错误解决方案:');
      console.log('1. 安装Puppeteer: npm install puppeteer');
      console.log('2. 如果是Linux服务器，安装依赖: apt-get install -y chromium-browser');
      console.log('3. 确保有足够的系统资源');
    } else if (error.message.includes('proxy') || error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 代理连接错误解决方案:');
      console.log('1. 检查代理服务器是否启动 (http://127.0.0.1:7890)');
      console.log('2. 验证代理软件设置（Clash、V2Ray等）');
      console.log('3. 检查防火墙是否阻止连接');
      console.log('4. 尝试更换代理端口');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 超时错误解决方案:');
      console.log('1. 检查网络连接稳定性');
      console.log('2. 增加超时时间配置');
      console.log('3. 检查代理服务器响应速度');
    } else if (error.message.includes('机器人检测') || error.message.includes('验证页面')) {
      console.log('\n🔧 机器人检测解决方案:');
      console.log('1. 使用不同的代理服务器IP');
      console.log('2. 增加请求间隔时间');
      console.log('3. 更换代理地区');
      console.log('4. 使用住宅IP代理');
    }
    
    console.log('\n📋 通用解决方案:');
    console.log('1. 确保代理软件正常运行');
    console.log('2. 检查系统防火墙设置');
    console.log('3. 验证网络连接稳定性');
    console.log('4. 稍后重试（避免频繁请求）');
    console.log('5. 如持续失败，考虑使用不同的代理服务');
    
    process.exit(1);
    
  } finally {
    // 确保浏览器关闭
    if (fetcher) {
      await fetcher.close();
    }
  }
}

// 运行测试
if (require.main === module) {
  testPuppeteerDataFetching();
}

module.exports = testPuppeteerDataFetching; 