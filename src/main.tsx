import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 确保容器元素存在
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

// 创建React根实例
const root = ReactDOM.createRoot(container);

// 渲染应用
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 热模块替换支持
if (import.meta.hot) {
  import.meta.hot.accept();
} 