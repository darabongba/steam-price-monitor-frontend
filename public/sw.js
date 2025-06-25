// Service Worker for Steam Price Monitor
const CACHE_NAME = 'steam-monitor-cache-v1';
const OFFLINE_URL = '/offline.html';

// 需要缓存的资源
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  OFFLINE_URL,
  // 静态资源会在构建时自动添加
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        // 强制激活新的Service Worker
        return self.skipWaiting();
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 立即控制所有客户端
        return self.clients.claim();
      })
      .then(() => {
        // 开始价格监控
        startPriceMonitoring();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 只处理GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 对于API请求，使用网络优先策略
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 缓存成功的API响应
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时从缓存返回
          return caches.match(event.request);
        })
    );
    return;
  }

  // 对于静态资源，使用缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        // 如果缓存中没有，从网络获取
        return fetch(event.request)
          .then((response) => {
            // 只缓存成功的响应
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // 如果是导航请求且网络失败，返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            throw new Error('Network failed and no cache available');
          });
      })
  );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'price-check') {
    event.waitUntil(performPriceCheck());
  } else if (event.tag === 'data-sync') {
    event.waitUntil(syncUserData());
  }
});

// 处理推送通知
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : '您有新的价格提醒',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Steam 价格提醒', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    // 打开应用
    event.waitUntil(
      clients.openWindow('/alerts')
    );
  } else if (event.action === 'close') {
    // 只关闭通知
    event.notification.close();
  } else {
    // 默认操作：打开应用
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 价格监控相关函数
let priceCheckInterval;

function startPriceMonitoring() {
  console.log('Starting price monitoring...');
  
  // 每小时检查一次价格
  priceCheckInterval = setInterval(() => {
    performPriceCheck();
  }, 60 * 60 * 1000); // 1小时

  // 立即执行一次检查
  performPriceCheck();
}

function stopPriceMonitoring() {
  console.log('Stopping price monitoring...');
  
  if (priceCheckInterval) {
    clearInterval(priceCheckInterval);
    priceCheckInterval = null;
  }
}

async function performPriceCheck() {
  try {
    console.log('Performing price check...');
    
    // 获取本地存储的提醒列表
    const alerts = await getStoredAlerts();
    
    if (!alerts || alerts.length === 0) {
      console.log('No alerts found');
      return;
    }

    for (const alert of alerts) {
      if (!alert.isActive || alert.triggered) {
        continue;
      }

      try {
        // 检查价格
        const currentPrice = await fetchGamePrice(alert.steamId);
        
        if (currentPrice && currentPrice.price <= alert.targetPrice) {
          // 价格达到目标，发送通知
          await sendPriceAlert(alert, currentPrice);
          
          // 更新提醒状态
          await updateAlertStatus(alert.id, {
            triggered: true,
            triggeredAt: new Date().toISOString(),
            lastPrice: currentPrice.price
          });
        } else if (currentPrice) {
          // 更新最后检查的价格
          await updateAlertStatus(alert.id, {
            lastPrice: currentPrice.price,
            checkCount: (alert.checkCount || 0) + 1,
            nextCheckAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          });
        }
      } catch (error) {
        console.error(`Error checking price for alert ${alert.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Price check failed:', error);
  }
}

async function fetchGamePrice(steamId) {
  try {
    // 从本地 game-details.json 文件获取价格信息
    const response = await fetch('/data/game-details.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const gameDetails = await response.json();
    
    // 查找对应的游戏
    const game = gameDetails.find(game => game.steamId === steamId);
    
    if (game && game.price) {
      return {
        price: game.price.final,
        originalPrice: game.price.initial,
        discountPercent: game.price.discount_percent,
        currency: game.price.currency,
        formatted: game.price.formatted
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch game price from local data:', error);
    return null;
  }
}

async function sendPriceAlert(alert, currentPrice) {
  const notification = {
    title: '🎮 价格提醒',
    body: `${alert.gameName || '游戏'} 已降价至 ${currentPrice.formatted}！`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `price-alert-${alert.id}`,
    data: {
      alertId: alert.id,
      steamId: alert.steamId,
      currentPrice: currentPrice.price,
      targetPrice: alert.targetPrice
    },
    actions: [
      {
        action: 'view-game',
        title: '查看游戏'
      },
      {
        action: 'dismiss',
        title: '忽略'
      }
    ]
  };

  return self.registration.showNotification(notification.title, notification);
}

// 存储相关函数
async function getStoredAlerts() {
  try {
    // 从IndexedDB获取提醒列表
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SteamPriceMonitor', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['alerts'], 'readonly');
        const store = transaction.objectStore('alerts');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };
        
        getAllRequest.onerror = () => {
          reject(getAllRequest.error);
        };
      };
    });
  } catch (error) {
    console.error('Failed to get stored alerts:', error);
    return [];
  }
}

async function updateAlertStatus(alertId, updates) {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SteamPriceMonitor', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['alerts'], 'readwrite');
        const store = transaction.objectStore('alerts');
        
        const getRequest = store.get(alertId);
        
        getRequest.onsuccess = () => {
          const alert = getRequest.result;
          if (alert) {
            Object.assign(alert, updates, { updatedAt: new Date().toISOString() });
            const putRequest = store.put(alert);
            
            putRequest.onsuccess = () => resolve(alert);
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            reject(new Error('Alert not found'));
          }
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  } catch (error) {
    console.error('Failed to update alert status:', error);
  }
}

async function syncUserData() {
  try {
    console.log('Syncing user data...');
    // 这里可以实现数据同步逻辑
    // 例如：上传到云端、备份数据等
  } catch (error) {
    console.error('Data sync failed:', error);
  }
}

console.log('Service Worker script loaded'); 