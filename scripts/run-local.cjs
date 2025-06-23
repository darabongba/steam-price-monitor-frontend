#!/usr/bin/env node

const { SteamDataFetcher, FileManager } = require('./data-fetcher.cjs');
const path = require('path');

async function testDataFetching() {
  console.log('🧪 开始本地测试数据拉取（反机器人检测版本）...');
  console.log('⚠️  这是本地测试，不会提交到Git');
  
  const startTime = Date.now();
  
  try {
    const fetcher = new SteamDataFetcher();
    
    console.log('\n📋 测试配置:');
    console.log('- 仅获取前10个游戏详情');
    console.log('- 跳过Git提交');
    console.log('- 数据保存到本地目录');
    
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
    const testIds = popularGames.slice(0, 5).map(g => g.steamId); // 只测试前5个
    const gameDetails = await fetcher.getGameDetails(testIds);
    
    console.log(`✅ 成功获取 ${gameDetails.length} 个游戏详情`);
    if (gameDetails.length > 0) {
      const sample = gameDetails[0];
      console.log('样本游戏详情:');
      console.log(`  - 名称: ${sample.name}`);
      console.log(`  - 开发商: ${sample.developer}`);
      console.log(`  - 类型: ${sample.genres.join(', ')}`);
      console.log(`  - 价格: ${sample.price ? `¥${sample.price.final}` : '免费'}`);
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
        lastUpdated: new Date().toISOString(),
        gamesCount: gameDetails.length,
        popularGamesCount: popularGames.length,
        priceHistoryCount: Object.keys(priceHistory).length,
        version: '1.1.0-test',
        dataSource: 'SteamSpy + Steam Store API (Anti-Detection Test)',
        isTestData: true,
        testLimited: true,
        requestStats: fetcher.getStats(),
      }),
    ]);
    
    // 6. 显示测试结果
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const stats = fetcher.getStats();
    
    console.log('\n🎉 本地测试完成!');
    console.log('=====================================');
    console.log(`⏱️  总耗时: ${duration}秒`);
    console.log(`📊 数据统计:`);
    console.log(`   - 热门游戏: ${popularGames.length} 个`);
    console.log(`   - 游戏详情: ${gameDetails.length} 个`);
    console.log(`   - 价格历史: ${historyCount} 个`);
    console.log(`   - 搜索索引: ${searchIndex.length} 个`);
    console.log(`🌐 网络统计:`);
    console.log(`   - 总请求数: ${stats.requestCount}`);
    console.log(`   - 失败次数: ${stats.failedAttempts}`);
    console.log(`   - 平均请求时间: ${Math.round(duration * 1000 / stats.requestCount)}ms`);
    
    // 检查数据质量
    console.log(`\n🔍 数据质量检查:`);
    const gamesWithDetails = gameDetails.filter(g => g.description && g.developer !== '未知开发商');
    const gamesWithPrices = gameDetails.filter(g => g.price);
    const gamesWithImages = gameDetails.filter(g => g.headerImage);
    
    console.log(`   - 有描述的游戏: ${gamesWithDetails.length}/${gameDetails.length} (${Math.round(gamesWithDetails.length/gameDetails.length*100)}%)`);
    console.log(`   - 有价格的游戏: ${gamesWithPrices.length}/${gameDetails.length} (${Math.round(gamesWithPrices.length/gameDetails.length*100)}%)`);
    console.log(`   - 有图片的游戏: ${gamesWithImages.length}/${gameDetails.length} (${Math.round(gamesWithImages.length/gameDetails.length*100)}%)`);
    
    if (stats.failedAttempts > 0) {
      console.log(`\n⚠️  注意: 有 ${stats.failedAttempts} 次请求失败`);
      if (stats.failedAttempts / stats.requestCount > 0.3) {
        console.log('   失败率较高，可能遇到了反爬虫机制');
        console.log('   建议: 增加延迟时间或使用代理');
      }
    }
    
    console.log('\n✅ 测试数据已保存到 public/data/ 目录');
    console.log('💡 如果测试成功，可以运行 npm run fetch-data 进行完整更新');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    if (error.message.includes('Rate limited')) {
      console.log('\n🔧 速率限制解决方案:');
      console.log('1. 等待几分钟后重试');
      console.log('2. 增加 REQUEST_DELAY 配置');
      console.log('3. 减少 BATCH_SIZE');
    } else if (error.message.includes('bot detection')) {
      console.log('\n🔧 机器人检测解决方案:');
      console.log('1. 使用VPN或代理服务器');
      console.log('2. 等待更长时间后重试');
      console.log('3. 手动访问Steam网站后重试');
    } else if (error.message.includes('JSON parse')) {
      console.log('\n🔧 数据解析错误解决方案:');
      console.log('1. 检查网络连接稳定性');
      console.log('2. 验证API端点是否正常');
      console.log('3. 可能遇到了HTML验证页面');
    }
    
    console.log('\n📋 通用解决方案:');
    console.log('1. 检查网络连接');
    console.log('2. 稍后重试（避免频繁请求）');
    console.log('3. 如持续失败，考虑使用其他数据源');
    
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testDataFetching();
}

module.exports = testDataFetching; 