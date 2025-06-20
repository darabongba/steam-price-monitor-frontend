# Steam游戏降价提醒工具 - 纯前端架构设计

## 1. 架构概览

采用纯前端架构，所有功能都在浏览器端实现：

```
React App (Frontend Only)
    ↓ 数据存储
IndexedDB / LocalStorage
    ↓ 定时任务
Service Worker + Web Worker
    ↓ 数据获取
Steam API Proxy / 第三方API
    ↓ 邮件通知
EmailJS / 第三方邮件服务
```

## 2. 技术栈调整

### 前端技术栈
- **React 18** + **TypeScript**: 主要开发框架
- **Vite** + **PWA**: 构建工具和渐进式Web应用
- **TanStack Query**: 数据获取和缓存管理
- **Tailwind CSS**: 样式框架
- **React Hook Form**: 表单处理
- **React Router**: 路由管理

### 数据存储方案
- **IndexedDB**: 主要数据存储（游戏信息、价格历史、用户设置）
- **LocalStorage**: 简单配置数据
- **SessionStorage**: 临时数据和缓存

### 后台任务处理
- **Service Worker**: 后台价格监控、离线支持
- **Web Worker**: 数据处理和计算密集型任务
- **浏览器定时器**: 定时触发价格检查

### 外部服务集成
- **Steam API 代理**: 解决CORS问题的API代理服务
- **EmailJS**: 前端邮件发送服务
- **Vercel/Netlify**: 静态网站托管

## 3. 项目目录结构

```
steamPriceOffNotification/
├── README.md
├── package.json
├── .env.example
├── .gitignore
│
├── public/
│   ├── index.html
│   ├── manifest.json          # PWA配置
│   ├── sw.js                  # Service Worker
│   └── icons/                 # 应用图标
│
├── src/
│   ├── components/            # 可复用组件
│   │   ├── common/           # 通用UI组件
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Toast.tsx
│   │   ├── GameSearch/       # 游戏搜索组件
│   │   │   ├── SearchBar.tsx
│   │   │   ├── GameList.tsx
│   │   │   └── GameCard.tsx
│   │   ├── PriceAlert/       # 价格提醒组件
│   │   │   ├── AlertForm.tsx
│   │   │   ├── AlertList.tsx
│   │   │   └── AlertCard.tsx
│   │   └── Settings/         # 设置组件
│   │       ├── EmailConfig.tsx
│   │       ├── NotificationSettings.tsx
│   │       └── DataManagement.tsx
│   │
│   ├── pages/                # 页面组件
│   │   ├── Home.tsx          # 首页
│   │   ├── Dashboard.tsx     # 控制面板
│   │   ├── Settings.tsx      # 设置页面
│   │   └── About.tsx         # 关于页面
│   │
│   ├── hooks/                # 自定义Hooks
│   │   ├── useGameSearch.ts  # 游戏搜索Hook
│   │   ├── usePriceMonitor.ts # 价格监控Hook
│   │   ├── useIndexedDB.ts   # IndexedDB操作Hook
│   │   ├── useNotification.ts # 通知Hook
│   │   └── useEmailService.ts # 邮件服务Hook
│   │
│   ├── services/             # 服务层
│   │   ├── steamService.ts   # Steam数据服务
│   │   ├── storageService.ts # 数据存储服务
│   │   ├── emailService.ts   # 邮件服务
│   │   ├── workerService.ts  # Worker通信服务
│   │   └── apiService.ts     # API请求服务
│   │
│   ├── workers/              # Web Workers
│   │   ├── priceMonitor.worker.ts  # 价格监控Worker
│   │   ├── dataProcessor.worker.ts # 数据处理Worker
│   │   └── emailSender.worker.ts   # 邮件发送Worker
│   │
│   ├── utils/                # 工具函数
│   │   ├── storage.ts        # 存储工具
│   │   ├── dateUtils.ts      # 日期工具
│   │   ├── priceUtils.ts     # 价格计算工具
│   │   ├── validators.ts     # 验证工具
│   │   └── constants.ts      # 常量定义
│   │
│   ├── types/                # TypeScript类型
│   │   ├── game.ts          # 游戏相关类型
│   │   ├── alert.ts         # 提醒相关类型
│   │   ├── user.ts          # 用户相关类型
│   │   └── storage.ts       # 存储相关类型
│   │
│   ├── store/                # 状态管理
│   │   ├── gameStore.ts     # 游戏状态
│   │   ├── alertStore.ts    # 提醒状态
│   │   ├── userStore.ts     # 用户状态
│   │   └── index.ts         # 状态管理入口
│   │
│   ├── styles/               # 样式文件
│   │   ├── globals.css      # 全局样式
│   │   └── components.css   # 组件样式
│   │
│   ├── App.tsx              # 应用主组件
│   ├── main.tsx             # 应用入口
│   └── vite-env.d.ts        # Vite类型声明
│
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # Tailwind配置
├── tsconfig.json            # TypeScript配置
├── postcss.config.js        # PostCSS配置
└── vercel.json              # Vercel部署配置
```

## 4. 核心功能实现方案

### 4.1 数据存储架构

**IndexedDB 数据库设计**：
```typescript
// 数据库结构
interface DBStructure {
  games: {
    id: string;
    steamId: string;
    name: string;
    imageUrl: string;
    description: string;
    developer: string;
    publisher: string;
    tags: string[];
    lastUpdated: Date;
  };
  
  alerts: {
    id: string;
    gameId: string;
    targetPrice: number;
    currentPrice: number;
    currency: string;
    isActive: boolean;
    triggered: boolean;
    createdAt: Date;
    triggeredAt?: Date;
  };
  
  priceHistory: {
    id: string;
    gameId: string;
    price: number;
    discount: number;
    currency: string;
    recordedAt: Date;
  };
  
  settings: {
    id: string;
    emailConfig: {
      serviceId: string;
      templateId: string;
      userId: string;
      email: string;
    };
    notifications: {
      enabled: boolean;
      frequency: 'hourly' | 'daily';
      sound: boolean;
    };
  };
}
```

### 4.2 Steam API 集成方案

**选项1: 使用代理服务**
```typescript
// 使用免费的CORS代理
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const STEAM_API_BASE = 'https://store.steampowered.com/api/';

// 或者使用专门的Steam API代理
const STEAM_PROXY = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';
```

**选项2: 使用第三方Steam API服务**
```typescript
// 使用第三方服务如SteamAPI.io
const THIRD_PARTY_API = 'https://api.steamapi.io/';

export class SteamService {
  async searchGames(query: string): Promise<Game[]> {
    const response = await fetch(`${THIRD_PARTY_API}/games/search?q=${query}`);
    return response.json();
  }
  
  async getGamePrice(steamId: string): Promise<PriceInfo> {
    const response = await fetch(`${THIRD_PARTY_API}/games/prices/${steamId}`);
    return response.json();
  }
}
```

### 4.3 价格监控实现

**Service Worker 后台监控**：
```typescript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'price-check') {
    event.waitUntil(checkPrices());
  }
});

async function checkPrices() {
  const alerts = await getActiveAlerts();
  
  for (const alert of alerts) {
    const currentPrice = await getCurrentPrice(alert.gameId);
    
    if (currentPrice <= alert.targetPrice) {
      await sendNotification(alert);
      await updateAlertStatus(alert.id, true);
    }
  }
}

// 定期注册后台同步
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_PRICE_CHECK') {
    self.registration.sync.register('price-check');
  }
});
```

**Web Worker 价格检查**：
```typescript
// workers/priceMonitor.worker.ts
import { SteamService } from '../services/steamService';

const steamService = new SteamService();

self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CHECK_PRICES':
      const results = await checkPricesForAlerts(data.alerts);
      self.postMessage({ type: 'PRICE_CHECK_COMPLETE', data: results });
      break;
  }
};

async function checkPricesForAlerts(alerts: Alert[]) {
  const results = [];
  
  for (const alert of alerts) {
    try {
      const currentPrice = await steamService.getGamePrice(alert.gameId);
      
      results.push({
        alertId: alert.id,
        currentPrice: currentPrice.price,
        triggered: currentPrice.price <= alert.targetPrice
      });
    } catch (error) {
      console.error('Price check failed:', error);
    }
  }
  
  return results;
}
```

### 4.4 邮件通知服务

**使用 EmailJS 实现前端邮件发送**：
```typescript
// services/emailService.ts
import emailjs from '@emailjs/browser';

export class EmailService {
  private serviceId: string;
  private templateId: string;
  private userId: string;

  constructor(config: EmailConfig) {
    this.serviceId = config.serviceId;
    this.templateId = config.templateId;
    this.userId = config.userId;
    
    emailjs.init(this.userId);
  }

  async sendPriceAlert(alert: PriceAlert): Promise<void> {
    const templateParams = {
      game_name: alert.game.name,
      current_price: alert.currentPrice,
      target_price: alert.targetPrice,
      buy_link: `https://store.steampowered.com/app/${alert.game.steamId}/`,
      user_email: alert.userEmail
    };

    await emailjs.send(
      this.serviceId,
      this.templateId,
      templateParams
    );
  }
}
```

**EmailJS 配置步骤**：
1. 注册 EmailJS 账户
2. 创建邮件服务连接
3. 设计邮件模板
4. 获取 Service ID、Template ID 和 User ID

### 4.5 PWA 功能实现

**渐进式Web应用配置**：
```json
// public/manifest.json
{
  "name": "Steam游戏降价提醒",
  "short_name": "Steam降价提醒",
  "description": "监控Steam游戏价格变化，及时获得降价提醒",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 5. 数据流程设计

### 5.1 游戏搜索流程
```
用户输入关键词 → 前端发起API请求 → Steam代理API返回结果 → 
缓存到IndexedDB → 展示搜索结果 → 用户选择游戏
```

### 5.2 价格监控流程
```
用户设置提醒 → 存储到IndexedDB → Service Worker定时检查 → 
Web Worker并发获取价格 → 比较价格变化 → 触发通知 → 发送邮件
```

### 5.3 数据同步流程
```
在线状态：实时获取数据 → 更新本地存储
离线状态：使用本地缓存 → 后台同步 → 上线后更新数据
```

## 6. 部署方案

### 6.1 静态网站托管
**推荐平台**：
- **Vercel**: 最佳的React应用托管
- **Netlify**: 功能丰富的静态网站托管
- **GitHub Pages**: 免费的静态网站托管
- **Firebase Hosting**: Google的静态网站托管

### 6.2 一键部署配置
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 6.3 环境变量配置
```bash
# .env.production
VITE_STEAM_API_PROXY=https://your-steam-proxy.com
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_USER_ID=your_user_id
```

## 7. 性能优化策略

### 7.1 前端性能优化
- **代码分割**: 路由级别的懒加载
- **虚拟列表**: 处理大量游戏数据
- **图片懒加载**: 优化游戏封面加载
- **缓存策略**: 合理使用浏览器缓存

### 7.2 数据存储优化
- **分页加载**: 避免一次性加载大量数据
- **数据压缩**: 存储前压缩数据
- **定期清理**: 清理过期的价格历史数据
- **索引优化**: 为IndexedDB创建合适的索引

### 7.3 网络请求优化
- **请求合并**: 批量获取多个游戏价格
- **请求缓存**: 避免重复的API调用
- **错误重试**: 网络失败时的重试机制
- **请求限流**: 避免API调用频率过高

## 8. 安全考虑

### 8.1 数据安全
- **本地加密**: 敏感数据加密存储
- **输入验证**: 严格验证用户输入
- **XSS防护**: 防止跨站脚本攻击

### 8.2 API安全
- **密钥管理**: 妥善管理第三方服务密钥
- **CORS配置**: 合理配置跨域请求
- **限流机制**: 防止API滥用

## 9. 优缺点分析

### 9.1 优点
✅ **部署简单**: 只需托管静态文件
✅ **成本低廉**: 无需服务器维护费用
✅ **离线支持**: PWA提供离线功能
✅ **响应快速**: 无需服务器往返时间
✅ **扩展性好**: 用户量增加不影响性能

### 9.2 缺点
❌ **功能限制**: 某些后端功能难以实现
❌ **数据安全**: 数据存储在客户端
❌ **API限制**: 依赖第三方服务和代理
❌ **邮件限制**: EmailJS有发送限制
❌ **浏览器依赖**: 功能受浏览器兼容性影响

## 10. 替代方案

### 10.1 混合架构
- 核心功能前端实现
- 复杂功能使用无服务器函数（Vercel Functions）
- 邮件服务使用云函数

### 10.2 渐进式迁移
- 第一阶段：纯前端实现
- 第二阶段：添加轻量级后端服务
- 第三阶段：完整的服务端架构

这个纯前端架构方案可以满足readme文件中的大部分需求，同时大大简化了部署和维护工作。虽然有一些限制，但对于个人项目或小型应用来说是非常实用的解决方案。 