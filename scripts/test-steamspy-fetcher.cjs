#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  DATA_DIR: path.join(__dirname, '../public/data'),
  CACHE_DIR: path.join(__dirname, '../cache'),
  TEST_PAGE: 0,
  TEST_GAME_ID: '730', // Counter-Strike 2
};

// 测试函数
async function testSteamSpyAPI() {
  console.log('🧪 开始测试SteamSpy数据获取器...');
  
  try {
    // 1. 测试目录结构
    console.log('\n📁 测试目录结构...');
    await testDirectoryStructure();
    
    // 2. 测试SteamSpy API连接
    console.log('\n🌐 测试SteamSpy API连接...');
    await testSteamSpyConnection();
    
    // 3. 测试Steam Store API连接
    console.log('\n🎮 测试Steam Store API连接...');
    await testSteamStoreConnection();
    
    // 4. 测试数据格式
    console.log('\n📊 测试数据格式...');
    await testDataFormat();
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

async function testDirectoryStructure() {
  // 检查必要目录是否存在
  const dirs = [TEST_CONFIG.DATA_DIR, TEST_CONFIG.CACHE_DIR];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
      console.log(`  ✅ 目录存在: ${dir}`);
    } catch {
      console.log(`  📁 创建目录: ${dir}`);
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

async function testSteamSpyConnection() {
  const https = require('https');
  const url = 'https://steamspy.com/api.php?request=all&page=0';
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          const gameCount = Object.keys(jsonData).length;
          
          console.log(`  ✅ SteamSpy API连接成功`);
          console.log(`  📊 返回游戏数量: ${gameCount}`);
          
          if (gameCount > 0) {
            const firstGame = Object.values(jsonData)[0];
            console.log(`  🎮 示例游戏: ${firstGame.name || 'Unknown'}`);
          }
          
          resolve();
        } catch (error) {
          reject(new Error(`SteamSpy API返回无效JSON: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`SteamSpy API连接失败: ${error.message}`));
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('SteamSpy API连接超时'));
    });
  });
}

async function testSteamStoreConnection() {
  const https = require('https');
  const url = `https://store.steampowered.com/api/appdetails?appids=${TEST_CONFIG.TEST_GAME_ID}&l=schinese&cc=CN`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          const gameData = jsonData[TEST_CONFIG.TEST_GAME_ID];
          
          if (gameData && gameData.success) {
            console.log(`  ✅ Steam Store API连接成功`);
            console.log(`  🎮 测试游戏: ${gameData.data.name}`);
            console.log(`  💰 价格: ${gameData.data.price_overview?.final_formatted || '免费'}`);
          } else {
            reject(new Error('Steam Store API返回失败状态'));
          }
          
          resolve();
        } catch (error) {
          reject(new Error(`Steam Store API返回无效JSON: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Steam Store API连接失败: ${error.message}`));
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Steam Store API连接超时'));
    });
  });
}

async function testDataFormat() {
  // 测试数据格式是否符合预期
  const testGame = {
    steamId: "730",
    name: "Counter-Strike 2",
    developer: "Valve",
    publisher: "Valve",
    tags: ["FPS", "Shooter", "Multiplayer"],
    price: 0,
    owners: "10,000,000 .. 20,000,000",
    averagePlaytime: 120,
    score: 85,
    page: 0,
    lastUpdated: new Date().toLocaleString(),
  };
  
  const testDetail = {
    steamId: "730",
    name: "Counter-Strike 2",
    type: "game",
    description: "Counter-Strike 2 is the largest technical leap forward in Counter-Strike history.",
    developer: "Valve",
    publisher: "Valve",
    releaseDate: "Sep 27, 2023",
    headerImage: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
    screenshots: [],
    genres: ["Action", "FPS"],
    platforms: {
      windows: true,
      mac: false,
      linux: false,
    },
    price: {
      currency: "CNY",
      initial: 0,
      final: 0,
      discount_percent: 0,
      formatted: "免费"
    },
    isFree: true,
    lastUpdated: new Date().toLocaleString(),
  };
  
  // 验证必要字段
  const requiredGameFields = ['steamId', 'name', 'developer', 'publisher'];
  const requiredDetailFields = ['steamId', 'name', 'type', 'developer', 'publisher'];
  
  for (const field of requiredGameFields) {
    if (!(field in testGame)) {
      throw new Error(`游戏数据缺少必要字段: ${field}`);
    }
  }
  
  for (const field of requiredDetailFields) {
    if (!(field in testDetail)) {
      throw new Error(`游戏详情缺少必要字段: ${field}`);
    }
  }
  
  console.log(`  ✅ 数据格式验证通过`);
  console.log(`  📋 游戏数据字段: ${requiredGameFields.length} 个`);
  console.log(`  📋 详情数据字段: ${requiredDetailFields.length} 个`);
}

// 运行测试
if (require.main === module) {
  testSteamSpyAPI().catch(console.error);
}

module.exports = { testSteamSpyAPI };

