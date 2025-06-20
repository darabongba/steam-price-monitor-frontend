# Steam游戏降价提醒工具 - 纯前端版快速开始

## 🚀 为什么选择纯前端架构？

✅ **零服务器成本** - 无需购买服务器或数据库
✅ **一键部署** - 直接托管到Vercel、Netlify等平台
✅ **离线工作** - PWA支持，无网络时也能查看数据
✅ **快速响应** - 本地数据存储，无需等待服务器响应
✅ **易于维护** - 只需关注前端代码，无需后端维护

## 📋 快速开始步骤

### 1. 环境准备
```bash
# 确保安装了Node.js 18+
node --version

# 全局安装必要工具
npm install -g vercel@latest
```

### 2. 项目初始化
```bash
# 创建项目
npm create vite@latest steam-price-monitor -- --template react-ts
cd steam-price-monitor

# 安装依赖
npm install

# 安装纯前端架构所需的额外依赖
npm install @emailjs/browser dexie zustand react-hot-toast react-icons
npm install -D vite-plugin-pwa
```

### 3. 配置第三方服务

#### 3.1 配置EmailJS (邮件服务)
1. 访问 [EmailJS官网](https://www.emailjs.com/) 注册账户
2. 创建邮件服务连接 (Gmail/Outlook)
3. 创建邮件模板
4. 获取Service ID、Template ID、User ID

#### 3.2 配置Steam API代理
```bash
# 选择以下任一方案：

# 方案1: 使用免费CORS代理
VITE_STEAM_API_PROXY=https://cors-anywhere.herokuapp.com/

# 方案2: 使用第三方Steam API服务
VITE_THIRD_PARTY_API=https://api.steamapi.io/

# 方案3: 部署自己的代理服务 (Vercel Functions)
VITE_VERCEL_API=/api/steam-proxy
```

### 4. 环境变量配置
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑环境变量
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id  
VITE_EMAILJS_USER_ID=your_user_id
VITE_STEAM_API_PROXY=your_proxy_url
```

### 5. 本地开发
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 6. 一键部署
```bash
# 部署到Vercel
vercel --prod

# 或者部署到Netlify
npm run build
# 然后将dist文件夹拖拽到Netlify
```

## 🏗️ 核心技术实现

### 数据存储 (IndexedDB)
```typescript
// 使用Dexie库简化IndexedDB操作
import Dexie from 'dexie';

export class SteamDB extends Dexie {
  games!: Dexie.Table<Game>;
  alerts!: Dexie.Table<PriceAlert>;
  
  constructor() {
    super('SteamPriceMonitor');
    this.version(1).stores({
      games: '++id, steamId, name, *tags',
      alerts: '++id, gameId, targetPrice, isActive'
    });
  }
}
```

### 价格监控 (Service Worker)
```typescript
// 注册Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// 定时检查价格
setInterval(() => {
  navigator.serviceWorker.ready.then(registration => {
    registration.sync.register('price-check');
  });
}, 60 * 60 * 1000); // 每小时检查
```

### 邮件通知 (EmailJS)
```typescript
import emailjs from '@emailjs/browser';

// 发送降价提醒
const sendPriceAlert = async (gameData: GameData) => {
  await emailjs.send(
    'your_service_id',
    'your_template_id',
    {
      game_name: gameData.name,
      current_price: gameData.currentPrice,
      target_price: gameData.targetPrice,
      buy_link: `https://store.steampowered.com/app/${gameData.steamId}/`
    },
    'your_user_id'
  );
};
```

## 📱 PWA功能

### 离线支持
```javascript
// 缓存策略
const CACHE_NAME = 'steam-price-monitor-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### 桌面安装
```typescript
// 提示用户安装PWA
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;
  showInstallButton();
});

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
};
```

## 🎯 功能特性

### ✅ 已实现功能
- 🔍 Steam游戏搜索
- 💰 价格监控和提醒
- 📧 邮件通知
- 💾 本地数据存储
- 📱 PWA支持
- 🚀 离线工作

### 🔄 工作原理
1. **游戏搜索**: 通过Steam API代理搜索游戏
2. **价格监控**: Service Worker后台定时检查价格
3. **数据存储**: IndexedDB存储所有数据在本地
4. **邮件通知**: EmailJS发送降价提醒邮件
5. **离线支持**: 缓存策略保证离线可用

## 🆚 与服务端版本对比

| 特性 | 纯前端版 | 服务端版 |
|------|----------|----------|
| 部署成本 | 免费 | 需要服务器 |
| 维护难度 | 低 | 中等 |
| 数据安全 | 客户端存储 | 服务器存储 |
| 扩展性 | 高(静态) | 高(动态) |
| 功能完整性 | 95% | 100% |
| 离线支持 | ✅ | ❌ |

## 💡 使用建议

### 适合场景
- 个人使用
- 小团队项目
- 快速原型开发
- 预算有限的项目

### 注意事项
- 邮件发送有频率限制 (EmailJS免费版每月200封)
- 依赖第三方API的稳定性
- 浏览器存储空间有限制
- 无法实现复杂的后端逻辑

## 🛠️ 扩展方案

### 混合架构 (推荐)
当需要更多功能时，可以渐进式添加：

```typescript
// 使用Vercel Functions处理复杂逻辑
// api/steam-proxy.ts
export default async function handler(req: any, res: any) {
  const { steamId } = req.query;
  
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${steamId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
```

## 🚀 立即开始

1. **复制代码模板**
2. **配置EmailJS服务**
3. **部署到Vercel/Netlify**
4. **开始监控游戏价格**

这个纯前端架构方案让你无需服务器即可拥有完整的Steam游戏降价提醒功能！ 