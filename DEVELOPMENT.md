# Steam游戏降价提醒工具 - 开发指南

## 快速开始

### 1. 环境准备

确保你的开发环境包含以下软件：

```bash
- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 5.0 (可选，也可使用MongoDB Atlas)
- Redis >= 6.0 (可选，用于缓存)
- Git
```

### 2. 项目克隆和安装

```bash
# 克隆项目
git clone https://github.com/your-username/steam-price-off-notification.git
cd steam-price-off-notification

# 安装所有依赖
npm run install:all

# 或者分别安装
npm install                # 根目录依赖
cd frontend && npm install # 前端依赖
cd ../backend && npm install # 后端依赖
```

### 3. 环境配置

```bash
# 复制环境变量文件
cp env.example .env

# 编辑环境变量文件，填入必要的配置
nano .env
```

### 4. 启动开发服务器

```bash
# 同时启动前后端开发服务器
npm run dev

# 或者分别启动
npm run dev:frontend  # 前端服务器 (端口3000)
npm run dev:backend   # 后端服务器 (端口5000)
```

访问 `http://localhost:3000` 查看前端应用
访问 `http://localhost:5000/api` 查看后端API

## 项目结构说明

### 前端架构 (frontend/)

```
frontend/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── common/     # 通用UI组件
│   │   ├── GameSearch/ # 游戏搜索组件
│   │   ├── GameList/   # 游戏列表组件
│   │   └── PriceAlert/ # 价格提醒组件
│   ├── pages/          # 页面组件
│   │   ├── Home/       # 首页
│   │   ├── Dashboard/  # 控制面板
│   │   └── Settings/   # 设置页面
│   ├── hooks/          # 自定义Hooks
│   ├── services/       # API服务
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript类型
│   └── store/          # 状态管理
└── public/
    ├── sw.js           # Service Worker
    └── manifest.json   # PWA配置
```

**技术栈**：
- React 18 + TypeScript
- Vite (构建工具)
- TanStack Query (数据获取)
- Tailwind CSS (样式)
- React Hook Form (表单)
- React Router (路由)

### 后端架构 (backend/)

```
backend/
├── src/
│   ├── controllers/    # 控制器层
│   ├── services/       # 业务逻辑层
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── middleware/     # 中间件
│   ├── utils/          # 工具函数
│   ├── workers/        # 后台任务
│   ├── config/         # 配置文件
│   └── app.ts          # 应用入口
└── tests/              # 测试文件
```

**技术栈**：
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Redis (缓存)
- node-cron (定时任务)
- Nodemailer (邮件服务)
- JWT (身份验证)

## 开发流程

### 1. 代码规范

项目使用ESLint和Prettier进行代码格式化：

```bash
# 检查代码规范
npm run lint

# 自动修复格式问题
npm run lint:fix

# 格式化代码
npm run format
```

### 2. 类型检查

```bash
# 运行TypeScript类型检查
npm run type-check
```

### 3. 测试

```bash
# 运行所有测试
npm test

# 运行测试并观察文件变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 4. 构建

```bash
# 构建生产版本
npm run build

# 清理构建文件
npm run clean
```

## 核心功能实现

### 1. 游戏搜索功能

**前端实现**：
```typescript
// hooks/useGameSearch.ts
export const useGameSearch = (query: string) => {
  return useQuery({
    queryKey: ['games', 'search', query],
    queryFn: () => gameService.searchGames(query),
    enabled: query.length > 2,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
};
```


### 2. 价格监控功能

**定时任务**：
```typescript
// workers/priceMonitorWorker.ts
import cron from 'node-cron';

// 每小时检查价格
cron.schedule('0 * * * *', async () => {
  await priceMonitorService.checkPrices();
});
```

**价格检查逻辑**：
```typescript
// services/priceMonitorService.ts
export class PriceMonitorService {
  async checkPrices(): Promise<void> {
    const alerts = await this.getActiveAlerts();
    
    for (const alert of alerts) {
      const currentPrice = await this.getCurrentPrice(alert.gameId);
      
      if (currentPrice <= alert.targetPrice) {
        await this.triggerAlert(alert);
      }
    }
  }
}
```

### 3. 邮件通知功能

```typescript
// services/emailService.ts
export class EmailService {
  async sendPriceAlert(alert: PriceAlert): Promise<void> {
    const emailTemplate = await this.loadTemplate('price-alert');
    const html = this.renderTemplate(emailTemplate, {
      gameName: alert.game.name,
      currentPrice: alert.currentPrice,
      targetPrice: alert.targetPrice,
      buyLink: `https://store.steampowered.com/app/${alert.game.steamId}/`
    });
    
    await this.sendEmail({
      to: alert.user.email,
      subject: `${alert.game.name} 降价提醒`,
      html
    });
  }
}
```

## API文档

### 认证接口

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "password123"
}
```

### 游戏接口

```http
GET /api/games/search?q=cyberpunk
Authorization: Bearer <token>
```

```http
GET /api/games/:steamId/price
Authorization: Bearer <token>
```

### 价格提醒接口

```http
GET /api/alerts
Authorization: Bearer <token>
```

```http
POST /api/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameId": "game_object_id",
  "targetPrice": 59.99
}
```

## 部署说明

### 1. 开发环境部署

```bash
# 启动开发服务器
npm run dev
```

### 2. 生产环境部署

**传统部署**：
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

**Docker部署**：
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

**云平台部署**：

*前端部署 (Vercel)*：
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
cd frontend && vercel --prod
```

*后端部署 (Railway/Heroku)*：
```bash
# 使用Railway
railway login
railway link
railway up

# 或使用Heroku
heroku create steam-price-monitor
heroku config:set NODE_ENV=production
git push heroku main
```

### 3. 环境变量配置

生产环境需要配置以下关键环境变量：

```bash
# 数据库
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/steam-price-monitor

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Steam API
STEAM_API_KEY=your-steam-api-key

# JWT
JWT_SECRET=super-secret-key
```

## 监控和维护

### 1. 日志管理

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### 2. 健康检查

```typescript
// routes/healthRoutes.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection()
  };
  
  res.json(health);
});
```

### 3. 性能监控

建议集成以下监控工具：
- **Sentry**: 错误追踪和性能监控
- **DataDog**: 基础设施监控
- **New Relic**: 应用性能监控

## 常见问题

### Q: Steam API请求频率限制怎么处理？
A: 实现请求队列和缓存机制，合理控制请求频率，避免触发限制。

### Q: 如何处理大量用户的价格监控？
A: 使用消息队列(Redis)和Worker进程，批量处理价格检查任务。

### Q: 邮件发送失败怎么办？
A: 实现重试机制和失败通知，使用多个SMTP服务提供商作为备选。

### Q: 如何优化前端性能？
A: 使用虚拟列表、懒加载、代码分割和Service Worker缓存等技术。

## 贡献指南

1. Fork项目到你的GitHub账户
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交代码：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

确保代码符合项目规范，并包含适当的测试。 