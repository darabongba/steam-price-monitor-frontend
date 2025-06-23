# Steam API 机器人验证解决方案

## 🤖 问题描述

在自动拉取Steam API数据时，可能会遇到以下机器人检测机制：

1. **速率限制 (Rate Limiting)** - HTTP 429错误
2. **访问拒绝 (Access Denied)** - HTTP 403错误  
3. **机器人验证页面** - 返回HTML而非JSON
4. **IP封禁** - 连接超时或拒绝
5. **Cloudflare保护** - 需要JavaScript验证

## 🛡️ 内置反检测机制

我们的数据拉取脚本已经内置了多层反机器人检测机制：

### 1. 智能请求头模拟
```javascript
// 随机浏览器用户代理池
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  // ... 更多真实用户代理
];

// 完整的浏览器头信息
headers: {
  'User-Agent': getRandomUserAgent(),
  'Referer': 'https://store.steampowered.com/',
  'Origin': 'https://store.steampowered.com',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  // ... 完整的浏览器头
}
```

### 2. 智能延迟机制
- **基础延迟**: 2秒（可配置）
- **随机化**: 0.5-1.5倍随机因子
- **指数退避**: 失败后等待时间递增
- **类型感知**: 根据错误类型调整等待时间

### 3. 多数据源容错
```javascript
const dataSources = [
  { name: 'SteamSpy', fetch: () => this.fetchFromSteamSpy() },
  { name: 'Steam Store Search', fetch: () => this.fetchFromSteamStore() },
  { name: 'Steam API IO', fetch: () => this.fetchFromSteamApiIO() }
];
```

### 4. 智能错误处理
- **HTML检测**: 识别验证页面
- **状态码分析**: 429/403特殊处理
- **重试策略**: 最多5次重试
- **会话重置**: 检测后重新生成请求头

## 🔧 配置参数说明

在 `scripts/data-fetcher.cjs` 中可以调整的关键参数：

```javascript
const CONFIG = {
  // 防机器人检测配置
  REQUEST_DELAY: 2000,        // 基础请求间隔(ms)
  MAX_RETRIES: 5,             // 最大重试次数
  BATCH_SIZE: 5,              // 批处理大小
  RANDOM_DELAY: true,         // 启用随机延迟
  
  // 数据限制（减少请求负载）
  POPULAR_GAMES_LIMIT: 50,    // 热门游戏数量
  MAX_GAMES_PER_CATEGORY: 20, // 每类别游戏数量
};
```

## 🚨 常见错误及解决方案

### 1. 速率限制 (HTTP 429)
**错误**: `Rate limited`
**解决方案**:
```bash
# 1. 增加延迟时间
export REQUEST_DELAY=5000  # 5秒延迟

# 2. 减少批处理大小
export BATCH_SIZE=3

# 3. 等待一段时间后重试
# 脚本会自动等待60秒+
```

### 2. 机器人检测 (HTTP 403)
**错误**: `Access denied - possible bot detection`
**解决方案**:
```bash
# 1. 使用VPN更换IP
# 2. 手动访问Steam网站"热身"
# 3. 等待2小时后重试
# 4. 使用代理服务器
```

### 3. 验证页面检测
**错误**: `Received HTML instead of JSON`
**解决方案**:
- 脚本会自动重新生成请求头
- 等待更长时间后重试
- 检查网络连接稳定性

### 4. 网络超时
**错误**: `Request timeout`
**解决方案**:
```bash
# 1. 检查网络连接
# 2. 使用稳定的网络环境
# 3. 增加超时时间（已设为15秒）
```

## 🌍 使用代理服务器

如果频繁遇到检测，可以配置代理：

### 方案1: HTTP代理
```javascript
// 在 AntiDetectionHttpClient 中添加代理支持
const request = https.get(url, {
  agent: new HttpsProxyAgent('http://proxy-server:port'),
  // ... 其他配置
});
```

### 方案2: SOCKS代理
```bash
# 使用代理工具
npm install -g global-tunnel-ng

# 设置环境变量
export HTTP_PROXY=http://proxy-server:port
export HTTPS_PROXY=http://proxy-server:port
```

### 方案3: VPN
- 使用VPN更换IP地址
- 选择不同地区的服务器
- 避免使用数据中心IP

## 📊 监控和诊断

### 运行测试脚本
```bash
# 本地测试（更安全）
npm run test-fetch

# 查看详细统计
# 会显示：
# - 请求成功率
# - 失败次数和类型  
# - 平均响应时间
# - 数据质量评分
```

### 检查日志输出
脚本会输出详细的诊断信息：
```
[1] 请求: https://steamspy.com/api.php?request=top100in2weeks
使用UA: Mozilla/5.0 (Windows NT 10.0...)...
✅ 从 SteamSpy 成功获取 50 个游戏
⚠️ 注意: 有 2 次请求失败
   失败率较高，可能遇到了反爬虫机制
```

## 🎯 最佳实践

### 1. 渐进式测试
```bash
# 第一步：小规模测试
npm run test-fetch

# 第二步：检查数据质量
# 确保成功率 > 70%

# 第三步：完整运行
npm run fetch-data
```

### 2. 时间选择
- **避免高峰期**: 美国/欧洲白天
- **推荐时间**: 北京时间早上9点（GitHub Actions默认）
- **频率控制**: 每天最多运行1-2次

### 3. 数据源备份
```javascript
// 如果主要数据源失败，自动切换到备用源
// 1. SteamSpy API (主要)
// 2. Steam Store Search (备用)  
// 3. Steam API IO (备用)
```

### 4. 渐进式降级
```javascript
// 根据检测强度自动调整策略
if (failureRate > 0.5) {
  CONFIG.REQUEST_DELAY *= 2;    // 延迟翻倍
  CONFIG.BATCH_SIZE = Math.max(1, CONFIG.BATCH_SIZE / 2); // 批次减半
}
```

## 🛠️ 自定义配置

### 环境变量配置
```bash
# .env 文件中设置
STEAM_REQUEST_DELAY=3000
STEAM_BATCH_SIZE=3
STEAM_MAX_RETRIES=3
STEAM_USE_PROXY=true
STEAM_PROXY_URL=http://proxy:port
```

### 配置文件
```javascript
// config/anti-detection.json
{
  "requestDelay": 3000,
  "batchSize": 3,
  "maxRetries": 5,
  "userAgents": ["custom-ua-1", "custom-ua-2"],
  "proxies": ["proxy1:port", "proxy2:port"]
}
```

## 🆘 终极解决方案

如果所有方法都失败：

### 1. 使用付费代理服务
- [ProxyMesh](https://proxymesh.com/)
- [Bright Data](https://brightdata.com/)
- [Oxylabs](https://oxylabs.io/)

### 2. 部署到云服务器
```bash
# 使用不同的服务器IP
# Railway, Render, DigitalOcean等
```

### 3. 使用第三方API
- [SteamWebAPI](https://steamcommunity.com/dev)
- [RAWG API](https://rawg.io/apidocs)
- [IGDB API](https://api-docs.igdb.com/)

### 4. 分布式拉取
```bash
# 使用多个GitHub Actions
# 不同时间、不同IP拉取不同数据
```

## 📈 成功率监控

脚本会自动记录成功率：
- **优秀**: 成功率 > 90%
- **良好**: 成功率 > 70%  
- **警告**: 成功率 < 70%
- **失败**: 成功率 < 50%

当成功率低于70%时，建议：
1. 暂停自动更新
2. 检查网络环境
3. 调整配置参数
4. 考虑使用代理

## 🔄 持续优化

我们的反检测机制会持续更新：
- 监控Steam API的变化
- 更新用户代理池
- 优化请求策略
- 添加新的数据源

---

**记住**: 合理使用API，避免给Steam服务器造成过大压力。我们的目标是获取必要的数据，而不是进行恶意爬取。 