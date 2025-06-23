# 静态数据方案使用指南

## 🎯 方案概述

通过Node.js脚本定时拉取Steam数据，保存为静态JSON文件，然后自动提交到GitHub，前端直接使用静态数据，完全避免跨域问题。

## 📁 文件结构

```
steamPriceOffNotification/
├── scripts/
│   └── data-fetcher.js          # 数据拉取脚本
├── .github/workflows/
│   └── update-steam-data.yml    # GitHub Actions工作流
├── public/data/                 # 静态数据文件夹
│   ├── metadata.json           # 数据元信息
│   ├── popular-games.json      # 热门游戏列表
│   ├── game-details.json       # 游戏详情
│   ├── price-history.json      # 价格历史
│   └── search-index.json       # 搜索索引
├── src/services/
│   └── staticDataService.ts    # 静态数据服务
└── STATIC-DATA-SETUP.md        # 本说明文档
```

## 🚀 快速开始

### 1. 本地测试数据拉取

```bash
# 安装依赖
npm install

# 设置脚本权限
chmod +x scripts/data-fetcher.js

# 手动运行数据拉取
node scripts/data-fetcher.js

# 检查生成的数据文件
ls -la public/data/
```

### 2. 配置GitHub Actions

GitHub Actions会自动执行以下任务：
- 每天北京时间上午9点自动运行
- 拉取最新的Steam数据
- 保存为JSON文件
- 自动提交到GitHub仓库

#### 手动触发更新

1. 进入GitHub仓库页面
2. 点击 `Actions` 标签
3. 选择 `更新Steam游戏数据` 工作流
4. 点击 `Run workflow`
5. 可选设置游戏数量限制

### 3. 前端集成

修改现有的Steam服务，使用静态数据：

```typescript
// 在你的组件或Hook中
import { staticDataService } from '@/services/staticDataService';

// 搜索游戏
const searchResults = await staticDataService.searchGames('赛博朋克', 10);

// 获取热门游戏
const popularGames = await staticDataService.getPopularGames();

// 获取游戏详情
const gameDetail = await staticDataService.getGameDetail('1091500');

// 获取价格信息
const price = await staticDataService.getGamePrice('1091500');
```

## 📊 数据文件说明

### metadata.json
```json
{
  "lastUpdated": "2024-01-15T09:00:00.000Z",
  "gamesCount": 50,
  "popularGamesCount": 100,
  "priceHistoryCount": 20,
  "version": "1.0.0",
  "dataSource": "SteamSpy + Steam Store API"
}
```

### popular-games.json
```json
[
  {
    "steamId": "1091500",
    "name": "Cyberpunk 2077",
    "developer": "CD PROJEKT RED",
    "publisher": "CD PROJEKT RED",
    "tags": ["RPG", "Open World", "Futuristic"],
    "price": 298,
    "owners": "10,000,000 .. 20,000,000",
    "averagePlaytime": 2847,
    "score": 76,
    "lastUpdated": "2024-01-15T09:00:00.000Z"
  }
]
```

### game-details.json
```json
[
  {
    "steamId": "1091500",
    "name": "Cyberpunk 2077",
    "type": "game",
    "description": "《赛博朋克2077》是一款开放世界动作冒险游戏...",
    "developer": "CD PROJEKT RED",
    "publisher": "CD PROJEKT RED",
    "releaseDate": "Dec 10, 2020",
    "headerImage": "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
    "screenshots": ["url1", "url2"],
    "genres": ["RPG", "Action"],
    "platforms": {
      "windows": true,
      "mac": false,
      "linux": false
    },
    "price": {
      "currency": "CNY",
      "initial": 298,
      "final": 149,
      "discount_percent": 50,
      "formatted": "¥149"
    },
    "achievements": 44,
    "metacriticScore": 86,
    "recommendations": 123456
  }
]
```

### price-history.json
```json
{
  "1091500": [
    {
      "date": "2024-01-01",
      "price": 298.00,
      "originalPrice": 298.00,
      "discount": 0
    },
    {
      "date": "2024-01-02",
      "price": 149.00,
      "originalPrice": 298.00,
      "discount": 50
    }
  ]
}
```

### search-index.json
```json
[
  {
    "steamId": "1091500",
    "name": "Cyberpunk 2077",
    "developer": "CD PROJEKT RED",
    "publisher": "CD PROJEKT RED",
    "tags": ["RPG", "Open World", "Futuristic"],
    "nameWords": ["cyberpunk", "2077"],
    "searchText": "cyberpunk 2077 cd projekt red cd projekt red"
  }
]
```

## ⚙️ 配置选项

### 环境变量（可选）

```bash
# 在GitHub Secrets中设置
NOTIFICATION_WEBHOOK=https://your-webhook-url.com  # 失败通知
DATA_UPDATE_LIMIT=100                              # 游戏数量限制
```

### 脚本配置

在 `scripts/data-fetcher.js` 中修改配置：

```javascript
const CONFIG = {
  POPULAR_GAMES_LIMIT: 100,        // 热门游戏数量
  TRENDING_GAMES_LIMIT: 50,        // 趋势游戏数量
  MAX_GAMES_PER_CATEGORY: 30,      // 每类别最大游戏数
  REQUEST_DELAY: 1000,             // 请求间隔(ms)
  BATCH_SIZE: 10,                  // 批处理大小
};
```

## 🔧 故障排除

### 常见问题

#### 1. 数据拉取失败
```bash
# 检查网络连接
curl -I https://steamspy.com/api.php

# 检查脚本权限
ls -la scripts/data-fetcher.js

# 手动运行并查看详细日志
node scripts/data-fetcher.js
```

#### 2. GitHub Actions失败
- 检查仓库权限设置
- 确认 `public/data/` 目录存在
- 查看Actions日志获取详细错误信息

#### 3. 前端数据加载失败
```javascript
// 检查数据文件是否存在
fetch('/data/metadata.json')
  .then(response => console.log('文件存在:', response.ok))
  .catch(error => console.error('文件不存在:', error));

// 检查服务状态
console.log(staticDataService.getStatus());
```

### 调试模式

```javascript
// 启用详细日志
console.log('数据新鲜度:', await staticDataService.checkDataFreshness());
console.log('缓存状态:', staticDataService.getStatus());

// 清理缓存重新加载
staticDataService.clearCache();
```

## 📈 性能优化

### 1. 缓存策略
- 静态数据缓存30分钟
- 浏览器HTTP缓存5分钟
- 服务端数据压缩

### 2. 数据优化
- 只获取必要字段
- 图片URL使用CDN
- 批量处理API请求

### 3. 更新频率
- 热门游戏：每天更新
- 游戏详情：每周更新
- 价格历史：每天更新

## 🔄 更新周期

| 数据类型 | 更新频率 | 数据大小 | 说明 |
|---------|---------|---------|------|
| 热门游戏 | 每天 | ~50KB | 基础信息 |
| 游戏详情 | 每天 | ~500KB | 详细信息 |
| 价格历史 | 每天 | ~100KB | 30天历史 |
| 搜索索引 | 每天 | ~30KB | 搜索优化 |

## 💡 扩展功能

### 1. 多数据源支持
```javascript
// 添加更多数据源
const ADDITIONAL_APIS = {
  STEAMCHARTS: 'https://api.steamcharts.com',
  STEAM250: 'https://api.steam250.com',
  HOWLONGTOBEAT: 'https://api.howlongtobeat.com'
};
```

### 2. 数据分析
```javascript
// 添加数据分析功能
async function analyzeGameTrends() {
  const priceHistory = await staticDataService.loadJSON('price-history.json');
  // 分析价格趋势、折扣模式等
}
```

### 3. 个性化推荐
```javascript
// 基于用户喜好推荐游戏
async function getRecommendations(userPreferences) {
  const games = await staticDataService.getGameDetails();
  // 实现推荐算法
}
```

## 📞 支持

如果遇到问题：
1. 查看GitHub Issues
2. 检查Actions运行日志
3. 验证数据文件完整性
4. 清理浏览器缓存

## 🎉 优势总结

✅ **零跨域问题** - 完全使用静态文件  
✅ **零运营成本** - GitHub Actions免费额度  
✅ **高性能** - 直接读取本地JSON文件  
✅ **高可靠性** - 不依赖第三方代理服务  
✅ **易维护** - 自动化数据更新流程  
✅ **可扩展** - 轻松添加新的数据源  

这个方案完美解决了你的跨域问题，同时提供了稳定、高效的数据服务！ 