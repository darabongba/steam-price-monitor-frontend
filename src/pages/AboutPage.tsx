import React from 'react';
import { Github, Heart, Coffee, Star } from 'lucide-react';

const AboutPage: React.FC = () => {
  const features = [
    {
      title: '实时价格监控',
      description: '自动监控Steam游戏价格变化，第一时间发现降价信息',
    },
    {
      title: '智能提醒系统',
      description: '支持邮件和浏览器推送通知，永不错过心仪游戏的优惠',
    },
    {
      title: '离线PWA应用',
      description: '支持离线使用，可安装到桌面，如同原生应用般流畅',
    },
    {
      title: '数据安全可靠',
      description: '所有数据存储在本地，保护用户隐私，支持数据导入导出',
    },
  ];

  const technologies = [
    'React 18',
    'TypeScript',
    'Tailwind CSS',
    'Vite',
    'PWA',
    'IndexedDB',
    'Service Worker',
    'EmailJS',
  ];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          关于 Steam 降价提醒
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          一个专为Steam游戏玩家打造的价格监控工具，帮助您在最佳时机购买心仪的游戏
        </p>
      </div>

      {/* 主要特性 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            主要特性
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            技术栈
          </h2>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 项目信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              开源项目
            </h2>
          </div>
          <div className="card-body">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              这是一个开源项目，欢迎大家贡献代码和提出建议。
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
              >
                <Star className="w-5 h-5" />
                <span>给个Star</span>
              </a>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              支持项目
            </h2>
          </div>
          <div className="card-body">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              如果这个项目对您有帮助，欢迎支持我们的开发工作。
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Heart className="w-5 h-5" />
                <span>赞助</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center space-x-2 text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                <Coffee className="w-5 h-5" />
                <span>请我喝咖啡</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="card">
        <div className="card-body text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2024 Steam 降价提醒. 基于 MIT 许可证开源.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            本项目与 Valve Corporation 或 Steam 无关联
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 