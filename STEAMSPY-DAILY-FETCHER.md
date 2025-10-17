# SteamSpy 每日数据获取器

## 概述

SteamSpy每日数据获取器是一个专门用于从SteamSpy API获取游戏数据并每日增量更新游戏详情的工具。它使用Puppeteer来模拟浏览器行为，避免被反爬虫机制检测。

## 功能特性

### 🎯 核心功能
- **分页获取游戏数据**: 从SteamSpy API获取1-999条游戏基础信息
- **每日增量更新**: 每天获取100条游戏详情，避免过度请求
- **进度记录**: 自动记录页面位置和详情请求位置，支持断点续传
- **智能去重**: 自动跳过已存在的游戏详情，避免重复请求
- **数据合并**: 将新获取的详情合并到现有的`game-details.json`文件中

### 🛡️ 反检测机制
- **随机延迟**: 请求间随机延迟，模拟人类行为
- **用户代理轮换**: 使用多个不同的浏览器用户代理
- **代理支持**: 支持HTTP代理，避免IP限制
- **请求重试**: 自动重试失败的请求，处理临时网络问题
- **机器人检测处理**: 检测并处理验证页面和机器人检测

### 📊 数据管理
- **进度跟踪**: 记录当前页数和详情索引位置
- **每日重置**: 每天自动重置详情获取计数
- **数据备份**: 自动提交到Git，保留历史版本
- **统计报告**: 详细的执行统计和成功率报告

## 配置说明

### 环境变量
```bash
# 禁用代理（在CI环境中）
export NO_PROXY=true

# 自定义代理服务器
export PROXY_SERVER=http://127.0.0.1:7890
```

### 主要配置参数
```javascript
const CONFIG = {
  // 数据限制
  TOTAL_GAMES_LIMIT: 999,        // 总游戏数量限制
  DAILY_DETAILS_LIMIT: 100,      // 每日获取详情数量
  MAX_PAGES: 20,                 // 最大页数限制
  
  // 请求控制
  REQUEST_DELAY: 3000,           // 基础请求延迟（毫秒）
  RANDOM_DELAY: true,            // 启用随机延迟
  MAX_RETRIES: 3,                // 最大重试次数
  BATCH_SIZE: 5,                 // 批处理大小
};
```

## 使用方法

### 1. 安装依赖
```bash
npm install puppeteer
```

### 2. 运行数据获取器
```bash
# 使用npm脚本
npm run fetch-steamspy-daily

# 或直接运行
node scripts/steamspy-daily-fetcher.cjs
```

### 3. 查看输出文件
脚本运行完成后，会在以下位置生成文件：

```
public/data/
├── steamspy-games.json      # SteamSpy游戏基础数据
├── game-details.json        # 合并后的游戏详情数据
└── steamspy-metadata.json   # 元数据和统计信息

cache/
└── steamspy-progress.json   # 进度记录文件
```

## 数据格式

### SteamSpy游戏数据 (`steamspy-games.json`)
```json
{
  "steamId": "730",
  "name": "Counter-Strike 2",
  "developer": "Valve",
  "publisher": "Valve",
  "tags": ["FPS", "Shooter", "Multiplayer"],
  "price": 0,
  "owners": "10,000,000 .. 20,000,000",
  "averagePlaytime": 120,
  "score": 85,
  "page": 0,
  "lastUpdated": "2024-01-15 10:30:00"
}
```

### 游戏详情数据 (`game-details.json`)
```json
{
  "steamId": "730",
  "name": "Counter-Strike 2",
  "type": "game",
  "description": "Counter-Strike 2 is the largest technical leap forward in Counter-Strike history.",
  "developer": "Valve",
  "publisher": "Valve",
  "releaseDate": "Sep 27, 2023",
  "headerImage": "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
  "screenshots": ["..."],
  "genres": ["Action", "FPS"],
  "platforms": {
    "windows": true,
    "mac": false,
    "linux": false
  },
  "price": {
    "currency": "CNY",
    "initial": 0,
    "final": 0,
    "discount_percent": 0,
    "formatted": "免费"
  },
  "isFree": true,
  "lastUpdated": "2024-01-15 10:30:00"
}
```

### 进度记录 (`steamspy-progress.json`)
```json
{
  "lastPage": 5,
  "lastDetailIndex": 250,
  "totalGames": 500,
  "totalDetails": 250,
  "lastUpdated": "2024-01-15 10:30:00",
  "dailyDetailsCount": 100,
  "lastDailyReset": "Mon Jan 15 2024"
}
```

## 工作流程

### 首次运行
1. **初始化**: 创建进度记录文件
2. **获取游戏列表**: 从SteamSpy API获取游戏基础数据
3. **获取详情**: 获取前100个游戏的详细信息
4. **保存数据**: 保存到`public/data/`目录
5. **提交Git**: 自动提交更改到版本控制

### 每日运行
1. **检查重置**: 如果是新的一天，重置每日详情计数
2. **继续获取**: 从上次的页面位置继续获取游戏数据
3. **增量详情**: 获取下一批100个游戏的详情
4. **数据合并**: 将新详情合并到现有数据中
5. **更新进度**: 更新进度记录文件

## 故障排除

### 常见问题

#### 1. Puppeteer安装失败
```bash
# 解决方案：使用npm安装
npm install puppeteer

# 或在Linux服务器上安装依赖
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

#### 2. 代理连接失败
```bash
# 检查代理服务器是否运行
curl -x http://127.0.0.1:7890 https://steamspy.com/api.php

# 或禁用代理
export NO_PROXY=true
npm run fetch-steamspy-daily
```

#### 3. 机器人检测
- 脚本会自动检测验证页面并等待
- 如果频繁遇到检测，可以增加延迟时间
- 考虑使用不同的代理服务器

#### 4. 内存不足
```bash
# 增加Node.js内存限制
node --max-old-space-size=4096 scripts/steamspy-daily-fetcher.cjs
```

### 日志分析

脚本会输出详细的执行日志，包括：
- 请求进度和延迟信息
- 成功/失败的请求统计
- 数据获取和保存状态
- 错误信息和重试情况

## 自动化部署

### GitHub Actions
```yaml
name: SteamSpy Daily Data Fetch

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行
  workflow_dispatch:     # 手动触发

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run fetch-steamspy-daily
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/data/ cache/
          git commit -m "🤖 自动更新SteamSpy数据" || exit 0
          git push
```

### 本地定时任务
```bash
# 添加到crontab
0 2 * * * cd /path/to/project && npm run fetch-steamspy-daily >> logs/steamspy-fetch.log 2>&1
```

## 性能优化

### 1. 调整配置参数
- 减少`REQUEST_DELAY`以提高速度（但可能增加被检测风险）
- 增加`BATCH_SIZE`以提高批处理效率
- 调整`DAILY_DETAILS_LIMIT`以平衡速度和稳定性

### 2. 资源使用
- 脚本使用无头浏览器，内存占用相对较低
- 可以通过调整`VIEWPORT`大小来优化性能
- 禁用图片和样式表加载以减少带宽使用

### 3. 并发控制
- 当前版本使用串行处理以确保稳定性
- 可以根据需要修改为并发处理（需要更复杂的错误处理）

## 注意事项

1. **API限制**: SteamSpy API有请求频率限制，请合理设置延迟
2. **数据准确性**: 获取的数据可能不是实时的，仅供参考
3. **网络稳定性**: 确保网络连接稳定，避免频繁中断
4. **存储空间**: 定期清理旧数据，避免占用过多存储空间
5. **法律合规**: 请遵守相关网站的使用条款和robots.txt

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持SteamSpy API数据获取
- 实现每日增量更新机制
- 添加进度记录和断点续传功能
- 集成Puppeteer反检测机制

