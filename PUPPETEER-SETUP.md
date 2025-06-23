# 🤖 Puppeteer + 代理解决方案使用指南

## 📋 概述

本项目现在支持使用Puppeteer + 代理服务器的方式来获取Steam数据，这是一个更强大的反机器人检测解决方案。

### ✨ Puppeteer方案优势

1. **真实浏览器环境** - 完全模拟用户浏览器行为
2. **强大的反检测能力** - 支持JavaScript渲染、Cookie管理
3. **代理支持** - 支持HTTP/HTTPS代理，绕过地区限制
4. **智能重试** - 遇到验证页面自动重新"热身"
5. **资源优化** - 自动阻止图片、CSS等非必要资源加载

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装Puppeteer
npm run install-puppeteer

# 或者直接安装
npm install puppeteer
```

### 2. 启动代理服务器

确保你的代理服务器运行在 `http://127.0.0.1:7890`

**支持的代理软件:**
- Clash for Windows
- V2Ray / V2RayN
- Shadowsocks
- 其他HTTP代理

**代理配置示例 (Clash):**
```yaml
mixed-port: 7890
allow-lan: true
mode: rule
external-controller: 127.0.0.1:9090
```

### 3. 本地测试

```bash
# 测试Puppeteer + 代理方案
npm run test-fetch-puppeteer
```

### 4. 完整运行

```bash
# 使用Puppeteer方案拉取完整数据
npm run fetch-data-puppeteer
```

## 🔧 配置选项

在 `scripts/data-fetcher-puppeteer.cjs` 中可以调整的配置：

```javascript
const CONFIG = {
  // 代理配置
  PROXY_SERVER: 'http://127.0.0.1:7890',
  
  // 浏览器配置
  HEADLESS: true,              // 是否无头模式
  VIEWPORT: { width: 1920, height: 1080 },
  PAGE_TIMEOUT: 30000,         // 页面超时(ms)
  
  // 防检测配置
  REQUEST_DELAY: 3000,         // 请求间隔(ms)
  RANDOM_DELAY: true,          // 随机延迟
  MAX_RETRIES: 3,              // 最大重试次数
  BATCH_SIZE: 3,               // 批处理大小
  
  // 数据配置
  POPULAR_GAMES_LIMIT: 30,     // 热门游戏数量
};
```

## 🌍 代理服务器配置

### 方案1: Clash for Windows

1. 下载并安装 [Clash for Windows](https://github.com/Fndroid/clash_for_windows_pkg)
2. 导入你的订阅链接或配置文件
3. 确保混合端口设置为 `7890`
4. 启动Clash并开启系统代理

### 方案2: V2RayN

1. 下载并安装 [V2RayN](https://github.com/2dust/v2rayN)
2. 添加你的V2Ray配置
3. 设置本地监听端口为 `7890`
4. 启动V2RayN

### 方案3: 自定义HTTP代理

如果你使用其他代理，修改配置：

```javascript
// 在 scripts/data-fetcher-puppeteer.cjs 中
const CONFIG = {
  PROXY_SERVER: 'http://your-proxy-ip:port',
  // ... 其他配置
};
```

## 🧪 测试和诊断

### 本地测试命令

```bash
# 快速测试（推荐）
npm run test-fetch-puppeteer

# 查看详细输出
node scripts/run-local-puppeteer.cjs
```

### 测试输出解读

```
🧪 开始本地测试数据拉取（Puppeteer + 代理版本）...
📡 使用代理: http://127.0.0.1:7890
🚀 启动Puppeteer浏览器...
✅ Puppeteer浏览器初始化完成
🌐 访问Steam首页进行"热身"...
✅ Steam首页访问成功

=== 第1步: 测试热门游戏获取 ===
[1] 等待 2856ms 后请求: https://steamspy.com/api.php?request=top100in2weeks
✅ 成功获取 30 个热门游戏

🎉 Puppeteer本地测试完成!
========================================
⏱️  总耗时: 45秒
📊 数据统计:
   - 热门游戏: 30 个
   - 游戏详情: 3 个
🌐 Puppeteer统计:
   - 总请求数: 5
   - 失败次数: 0
   - 成功率: 100.0%
   - 模式: Puppeteer + Proxy
```

### 成功率指标

- **优秀**: 成功率 > 90%
- **良好**: 成功率 > 80%
- **警告**: 成功率 < 80%
- **失败**: 成功率 < 50%

## ❌ 常见问题解决

### 1. 代理连接失败

**错误**: `ECONNREFUSED 127.0.0.1:7890`

**解决方案**:
```bash
# 检查代理服务器状态
curl -x http://127.0.0.1:7890 http://httpbin.org/ip

# 检查端口占用
netstat -tulpn | grep 7890

# 重启代理软件
```

### 2. Puppeteer安装失败

**错误**: `Cannot find module 'puppeteer'`

**解决方案**:
```bash
# 清理并重新安装
npm cache clean --force
npm run install-puppeteer

# 如果网络问题，使用淘宝镜像
npm config set registry https://registry.npm.taobao.org
npm install puppeteer
```

### 3. Chrome依赖缺失 (Linux)

**错误**: `Could not find Chromium`

**解决方案**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y chromium-browser

# CentOS/RHEL
sudo yum install -y chromium

# 或者安装Google Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable
```

### 4. 机器人检测

**错误**: `检测到验证页面，可能遇到机器人检测`

**解决方案**:
- 使用不同地区的代理服务器
- 增加请求延迟时间 (`REQUEST_DELAY`)
- 使用住宅IP代理而非数据中心IP
- 更换代理提供商

### 5. 内存不足 (服务器环境)

**错误**: `Navigation timeout` 或浏览器崩溃

**解决方案**:
```bash
# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 或者调整Puppeteer配置
# 在 CONFIG 中设置
HEADLESS: true,              // 确保无头模式
VIEWPORT: { width: 1280, height: 720 },  // 减小视窗大小
```

## 🔄 GitHub Actions自动化

项目包含两个GitHub Actions工作流：

### 1. 标准模式 (不使用代理)
文件: `.github/workflows/update-steam-data.yml`
- 适用于GitHub Actions环境
- 不需要代理服务器
- 基于HTTP请求的反检测机制

### 2. Puppeteer模式 (GitHub环境下不使用代理)
文件: `.github/workflows/update-steam-data-puppeteer.yml`
- 使用Puppeteer浏览器模拟
- GitHub Actions环境下自动禁用代理
- 更强的反检测能力

### 手动触发

在GitHub仓库页面：
1. 点击 "Actions" 标签
2. 选择工作流
3. 点击 "Run workflow"
4. 选择运行模式

## 📊 性能对比

| 方案 | 成功率 | 速度 | 资源占用 | 检测难度 |
|------|--------|------|----------|----------|
| 标准HTTP | 70-85% | 快 | 低 | 容易检测 |
| Puppeteer | 85-95% | 中等 | 中等 | 难以检测 |
| Puppeteer+代理 | 90-98% | 较慢 | 高 | 很难检测 |

## 🎯 最佳实践

### 1. 本地开发
```bash
# 使用Puppeteer + 代理获得最佳成功率
npm run test-fetch-puppeteer
```

### 2. CI/CD环境
```bash
# GitHub Actions自动使用无代理Puppeteer模式
# 无需额外配置
```

### 3. 生产环境
- 使用稳定的代理服务器
- 监控成功率，低于80%时更换代理
- 设置合理的请求间隔避免触发限制

### 4. 数据质量监控
- 检查数据完整性
- 验证游戏信息准确性
- 监控API响应时间

## 🆘 技术支持

如果遇到问题：

1. **查看日志**: 运行测试命令查看详细错误信息
2. **检查网络**: 确保代理服务器正常工作
3. **更新依赖**: `npm update` 更新到最新版本
4. **重置环境**: 清理缓存和重新安装依赖

---

**记住**: Puppeteer + 代理是最强大的方案，但也最复杂。如果只是偶尔使用，标准HTTP方案可能就足够了。选择最适合你需求的方案。 