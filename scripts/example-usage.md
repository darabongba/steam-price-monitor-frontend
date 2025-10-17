# SteamSpy 数据获取器使用示例

## 快速开始

### 1. 环境准备

确保已安装Node.js和npm：

```bash
# 检查Node.js版本
node --version  # 需要 >= 18.0.0

# 检查npm版本
npm --version   # 需要 >= 8.0.0
```

### 2. 安装依赖

```bash
# 安装项目依赖
npm install

# 安装Puppeteer（如果还没有）
npm install puppeteer
```

### 3. 测试连接

在运行完整的数据获取之前，先测试API连接：

```bash
# 测试SteamSpy和Steam Store API连接
npm run test-steamspy
```

预期输出：
```
🧪 开始测试SteamSpy数据获取器...

📁 测试目录结构...
  ✅ 目录存在: /path/to/project/public/data
  ✅ 目录存在: /path/to/project/cache

🌐 测试SteamSpy API连接...
  ✅ SteamSpy API连接成功
  📊 返回游戏数量: 50
  🎮 示例游戏: Counter-Strike 2

🎮 测试Steam Store API连接...
  ✅ Steam Store API连接成功
  🎮 测试游戏: Counter-Strike 2
  💰 价格: 免费

📊 测试数据格式...
  ✅ 数据格式验证通过
  📋 游戏数据字段: 4 个
  📋 详情数据字段: 5 个

✅ 所有测试通过！
```

### 4. 运行数据获取

#### 首次运行（获取完整数据）

```bash
# 运行SteamSpy数据获取器
npm run fetch-steamspy-daily
```

首次运行会：
- 从SteamSpy API获取前几页的游戏基础数据
- 获取前100个游戏的详细信息
- 创建进度记录文件
- 保存数据到`public/data/`目录

预期输出：
```
🚀 开始SteamSpy每日数据获取...
时间: 2024-01-15 10:30:00

📋 配置信息:
- 代理服务器: http://127.0.0.1:7890
- 总游戏限制: 999
- 每日详情限制: 100
- 批处理大小: 5

🔄 新的一天，重置每日详情计数

🎮 开始获取SteamSpy游戏数据...
📄 获取第 0 页游戏数据...
[1] 等待 3500ms 后请求: https://steamspy.com/api.php?request=all&page=0
✅ 第 0 页获取 50 个游戏
📊 当前总计: 50 个游戏 (新增 50 个)
⏳ 页面间等待 4.2 秒...
📄 获取第 1 页游戏数据...
[2] 等待 2800ms 后请求: https://steamspy.com/api.php?request=all&page=1
✅ 第 1 页获取 50 个游戏
📊 当前总计: 100 个游戏 (新增 50 个)

📋 准备获取详情批次: 1-100 (共 100 个)
🎯 获取 100 个游戏的详细信息...
✅ 获取游戏详情: Counter-Strike 2 (1/100)
⏳ 详情间等待 3.1 秒...
✅ 获取游戏详情: Dota 2 (2/100)
...

💾 保存数据文件...
✅ 数据文件保存完成

✅ 成功提交并推送到GitHub

✅ SteamSpy数据获取完成!
⏱️  耗时: 1250秒
📊 统计:
  - 游戏总数: 100
  - 详情总数: 100
  - 当前页数: 2
  - 每日详情: 100/100
  - 总请求数: 102
  - 失败次数: 0
  - 成功率: 100.0%
```

#### 每日运行（增量更新）

```bash
# 每天运行一次，获取新的游戏数据和详情
npm run fetch-steamspy-daily
```

每日运行会：
- 检查是否是新的日期，如果是则重置每日详情计数
- 从上次的页面位置继续获取游戏数据
- 获取下一批100个游戏的详情
- 更新进度记录

### 5. 查看生成的数据

运行完成后，查看生成的文件：

```bash
# 查看游戏基础数据
ls -la public/data/steamspy-games.json

# 查看游戏详情数据
ls -la public/data/game-details.json

# 查看元数据
cat public/data/steamspy-metadata.json

# 查看进度记录
cat cache/steamspy-progress.json
```

## 配置自定义

### 修改配置参数

编辑 `scripts/steamspy-daily-fetcher.cjs` 文件中的 `CONFIG` 对象：

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

### 环境变量配置

```bash
# 禁用代理（在CI环境中）
export NO_PROXY=true

# 自定义代理服务器
export PROXY_SERVER=http://127.0.0.1:8080

# 运行脚本
npm run fetch-steamspy-daily
```

## 自动化部署

### GitHub Actions 配置

创建 `.github/workflows/steamspy-daily.yml`：

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
          cache: 'npm'
      
      - run: npm ci
      
      - name: Test API connections
        run: npm run test-steamspy
      
      - name: Fetch SteamSpy data
        run: npm run fetch-steamspy-daily
      
      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/data/ cache/
          git commit -m "🤖 自动更新SteamSpy数据 - $(date +'%Y-%m-%d')" || exit 0
          git push
```

### 本地定时任务

```bash
# 编辑crontab
crontab -e

# 添加定时任务（每天凌晨2点运行）
0 2 * * * cd /path/to/your/project && npm run fetch-steamspy-daily >> logs/steamspy-fetch.log 2>&1
```

## 故障排除

### 常见问题

#### 1. Puppeteer安装失败

```bash
# 解决方案
npm install puppeteer --unsafe-perm=true

# 或在Linux服务器上安装系统依赖
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

#### 2. 网络连接问题

```bash
# 测试网络连接
curl -I https://steamspy.com/api.php
curl -I https://store.steampowered.com/api/appdetails?appids=730

# 如果使用代理，测试代理连接
curl -x http://127.0.0.1:7890 https://steamspy.com/api.php
```

#### 3. 内存不足

```bash
# 增加Node.js内存限制
node --max-old-space-size=4096 scripts/steamspy-daily-fetcher.cjs
```

#### 4. 权限问题

```bash
# 确保脚本有执行权限
chmod +x scripts/steamspy-daily-fetcher.cjs
chmod +x scripts/test-steamspy-fetcher.cjs
```

### 日志分析

脚本会输出详细的执行日志，包括：
- 请求进度和延迟信息
- 成功/失败的请求统计
- 数据获取和保存状态
- 错误信息和重试情况

如果遇到问题，请检查：
1. 网络连接是否正常
2. 代理服务器是否运行
3. API是否可访问
4. 磁盘空间是否充足
5. 权限是否正确

## 数据使用

### 在前端应用中使用

```javascript
// 加载游戏数据
const games = await fetch('/data/steamspy-games.json').then(r => r.json());
const details = await fetch('/data/game-details.json').then(r => r.json());

// 搜索游戏
const searchGames = (query) => {
  return games.filter(game => 
    game.name.toLowerCase().includes(query.toLowerCase()) ||
    game.developer.toLowerCase().includes(query.toLowerCase())
  );
};

// 获取游戏详情
const getGameDetail = (steamId) => {
  return details.find(detail => detail.steamId === steamId);
};
```

### 数据分析

```javascript
// 统计信息
const stats = {
  totalGames: games.length,
  totalDetails: details.length,
  freeGames: games.filter(g => g.price === 0).length,
  averagePrice: games.reduce((sum, g) => sum + g.price, 0) / games.length,
  topDevelopers: Object.entries(
    games.reduce((acc, g) => {
      acc[g.developer] = (acc[g.developer] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10)
};
```

## 注意事项

1. **API限制**: SteamSpy API有请求频率限制，请合理设置延迟
2. **数据准确性**: 获取的数据可能不是实时的，仅供参考
3. **网络稳定性**: 确保网络连接稳定，避免频繁中断
4. **存储空间**: 定期清理旧数据，避免占用过多存储空间
5. **法律合规**: 请遵守相关网站的使用条款和robots.txt
6. **备份重要**: 定期备份数据文件，避免数据丢失

