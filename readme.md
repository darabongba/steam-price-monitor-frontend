# Steam 游戏降价提醒

一个专为Steam游戏玩家打造的价格监控工具，帮助您在最佳时机购买心仪的游戏。

## ✨ 主要特性

- 🎮 **实时价格监控** - 自动监控Steam游戏价格变化
- 📧 **智能提醒系统** - 支持邮件和浏览器推送通知
- 💾 **离线PWA应用** - 支持离线使用，可安装到桌面
- 🔒 **数据安全可靠** - 所有数据存储在本地，保护用户隐私
- 🌙 **深色模式支持** - 自适应系统主题
- 📱 **响应式设计** - 完美适配桌面和移动设备

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/steam-price-notification.git
cd steam-price-notification

# 安装依赖
pnpm install
```

### 环境配置

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量
# 配置Steam API和EmailJS等服务
```

### 开发运行

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## 📦 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式框架**: Tailwind CSS
- **状态管理**: Zustand
- **数据查询**: TanStack Query
- **数据存储**: IndexedDB (Dexie.js)
- **PWA支持**: Vite PWA Plugin
- **邮件服务**: EmailJS
- **图标库**: Lucide React

## 🏗️ 项目结构

```
steamPriceOffNotification/
├── public/                 # 静态资源
│   ├── sw.js              # Service Worker
│   └── manifest.json      # PWA配置
├── src/
│   ├── components/        # 可复用组件
│   │   ├── common/       # 通用UI组件
│   │   ├── GameSearch/   # 游戏搜索组件
│   │   └── PriceAlert/   # 价格提醒组件
│   ├── pages/            # 页面组件
│   ├── hooks/            # 自定义Hooks
│   ├── services/         # 服务层
│   ├── stores/           # 状态管理
│   ├── types/            # TypeScript类型
│   ├── utils/            # 工具函数
│   └── App.tsx           # 应用入口
├── package.json
├── vite.config.ts        # Vite配置
├── tailwind.config.js    # Tailwind配置
└── tsconfig.json         # TypeScript配置
```

## 🔧 配置说明

### Steam API配置

1. 获取Steam API密钥：[Steam Web API](https://steamcommunity.com/dev/apikey)
2. 配置代理服务器（解决CORS问题）
3. 在`.env`文件中设置相关变量

### EmailJS配置

1. 注册[EmailJS](https://www.emailjs.com/)账户
2. 创建邮件服务和模板
3. 在`.env`文件中配置服务ID、模板ID和公钥

### PWA配置

应用支持PWA功能，用户可以：
- 将应用安装到桌面
- 离线使用基本功能
- 接收推送通知

## 📱 功能介绍

### 游戏搜索
- 搜索Steam平台上的游戏
- 查看游戏详情和价格信息
- 支持多种排序和过滤方式

### 价格提醒
- 设置目标价格
- 自动监控价格变化
- 多种通知方式（邮件、推送）

### 数据管理
- 本地数据存储
- 数据导入导出
- 统计信息查看

## 🔄 部署

### Vercel部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel --prod
```

### 其他平台

项目支持部署到任何静态网站托管平台：
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本项目与 Valve Corporation 或 Steam 无关联。Steam 是 Valve Corporation 的商标。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

如果这个项目对您有帮助，请给个 ⭐️ 支持一下！
