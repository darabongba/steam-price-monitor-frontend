import Dexie, { Table } from 'dexie';
import { Game, PriceHistory, LocalGame } from '@/types/game';
import { PriceAlert, AlertNotification } from '@/types/alert';
import { UserSettings } from '@/types/user';
import { CacheEntry, StorageStats, BackupData, ImportResult } from '@/types/storage';
import { DB_NAME, DB_VERSION } from '@/utils/constants';

// IndexedDB数据库类
class SteamPriceMonitorDB extends Dexie {
  games!: Table<Game>;
  alerts!: Table<PriceAlert>;
  priceHistory!: Table<PriceHistory>;
  notifications!: Table<AlertNotification>;
  settings!: Table<UserSettings>;
  cache!: Table<CacheEntry>;

  constructor() {
    super(DB_NAME);

    this.version(DB_VERSION).stores({
      games: '++id, steamId, name, lastUpdated, createdAt',
      alerts: '++id, gameId, steamId, isActive, triggered, createdAt, nextCheckAt',
      priceHistory: '++id, gameId, steamId, recordedAt, price',
      notifications: '++id, alertId, type, sentAt, read',
      settings: '++id, email, updatedAt',
      cache: '++id, key, expiresAt, createdAt, *tags',
    });
  }
}

// 数据库实例
const db = new SteamPriceMonitorDB();

// 存储服务类
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // 游戏相关操作
  async addGame(game: Game): Promise<string> {
    try {
      const localGame: LocalGame = {
        ...game,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      
      const id = await db.games.add(localGame);
      return String(id);
    } catch (error) {
      console.error('添加游戏失败:', error);
      throw new Error('添加游戏失败');
    }
  }

  async getGame(id: string): Promise<Game | undefined> {
    try {
      return await db.games.get(id);
    } catch (error) {
      console.error('Failed to get game:', error);
      throw new Error('获取游戏失败');
    }
  }

  async getGameBySteamId(steamId: string): Promise<Game | undefined> {
    try {
      return await db.games.where('steamId').equals(steamId).first();
    } catch (error) {
      console.error('Failed to get game by steamId:', error);
      throw new Error('获取游戏失败');
    }
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<void> {
    try {
      await db.games.update(id, {
        ...updates,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update game:', error);
      throw new Error('更新游戏失败');
    }
  }

  async deleteGame(id: string): Promise<void> {
    try {
      await db.transaction('rw', [db.games, db.alerts, db.priceHistory], async () => {
        await db.games.delete(id);
        await db.alerts.where('gameId').equals(id).delete();
        await db.priceHistory.where('gameId').equals(id).delete();
      });
    } catch (error) {
      console.error('Failed to delete game:', error);
      throw new Error('删除游戏失败');
    }
  }

  async getAllGames(): Promise<Game[]> {
    try {
      return await db.games.orderBy('lastUpdated').reverse().toArray();
    } catch (error) {
      console.error('Failed to get all games:', error);
      throw new Error('获取游戏列表失败');
    }
  }

  // 价格提醒相关操作
  async addAlert(alert: Omit<PriceAlert, 'id'>): Promise<string> {
    try {
      const id = await db.alerts.add({
        ...alert,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextCheckAt: new Date().toISOString(),
        checkCount: 0,
      });
      return String(id);
    } catch (error) {
      console.error('Failed to add alert:', error);
      throw new Error('添加价格提醒失败');
    }
  }

  async getAlert(id: string): Promise<PriceAlert | undefined> {
    try {
      return await db.alerts.get(id);
    } catch (error) {
      console.error('Failed to get alert:', error);
      throw new Error('获取价格提醒失败');
    }
  }

  async updateAlert(id: string, updates: Partial<PriceAlert>): Promise<void> {
    try {
      await db.alerts.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update alert:', error);
      throw new Error('更新价格提醒失败');
    }
  }

  async deleteAlert(id: string): Promise<void> {
    try {
      await db.alerts.delete(id);
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw new Error('删除价格提醒失败');
    }
  }

  async getAllAlerts(): Promise<PriceAlert[]> {
    try {
      return await db.alerts.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Failed to get all alerts:', error);
      throw new Error('获取价格提醒列表失败');
    }
  }

  async getActiveAlerts(): Promise<PriceAlert[]> {
    try {
      return await db.alerts.filter(alert => alert.isActive).toArray();
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      throw new Error('获取活跃提醒失败');
    }
  }

  async getAlertsForCheck(): Promise<PriceAlert[]> {
    try {
      const now = new Date();
      return await db.alerts
        .filter(alert => alert.isActive && !alert.triggered && new Date(alert.nextCheckAt) <= now)
        .toArray();
    } catch (error) {
      console.error('Failed to get alerts for check:', error);
      throw new Error('获取待检查提醒失败');
    }
  }

  // 价格历史相关操作
  async addPriceHistory(priceHistory: Omit<PriceHistory, 'id'>): Promise<string> {
    try {
      const id = await db.priceHistory.add({
        ...priceHistory,
        id: crypto.randomUUID(),
      });
      return String(id);
    } catch (error) {
      console.error('Failed to add price history:', error);
      throw new Error('添加价格历史失败');
    }
  }

  async getPriceHistory(gameId: string, limit: number = 100): Promise<PriceHistory[]> {
    try {
      const allHistory = await db.priceHistory
        .where('gameId')
        .equals(gameId)
        .toArray();
      
      // 手动排序并限制数量
      return allHistory
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get price history:', error);
      throw new Error('获取价格历史失败');
    }
  }

  async cleanOldPriceHistory(days: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return await db.priceHistory
        .where('recordedAt')
        .below(cutoffDate)
        .delete();
    } catch (error) {
      console.error('Failed to clean old price history:', error);
      throw new Error('清理价格历史失败');
    }
  }

  // 通知相关操作
  async addNotification(notification: Omit<AlertNotification, 'id'>): Promise<string> {
    try {
      const id = await db.notifications.add({
        ...notification,
        id: crypto.randomUUID(),
      });
      return String(id);
    } catch (error) {
      console.error('Failed to add notification:', error);
      throw new Error('添加通知失败');
    }
  }

  async getNotifications(limit: number = 50): Promise<AlertNotification[]> {
    try {
      return await db.notifications
        .orderBy('sentAt')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw new Error('获取通知失败');
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await db.notifications.update(id, { read: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new Error('标记通知已读失败');
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await db.notifications.delete(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw new Error('删除通知失败');
    }
  }

  // 设置相关操作
  async saveSettings(settings: Omit<UserSettings, 'id'>): Promise<string> {
    try {
      const existing = await db.settings.toCollection().first();
      if (existing) {
        await db.settings.update(existing.id, {
          ...settings,
          updatedAt: new Date().toISOString(),
        });
        return existing.id;
      } else {
        const id = await db.settings.add({
          ...settings,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        return String(id);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('保存设置失败');
    }
  }

  async getSettings(): Promise<UserSettings | undefined> {
    try {
      return await db.settings.toCollection().first();
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw new Error('获取设置失败');
    }
  }

  // 缓存相关操作
  async setCache(key: string, data: any, ttl: number = 3600000, tags: string[] = []): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl);
      await db.cache.put({
        id: crypto.randomUUID(),
        key,
        data,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        tags,
      });
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw new Error('设置缓存失败');
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const now = new Date();
      const entry = await db.cache
        .where('key')
        .equals(key)
        .filter(entry => new Date(entry.expiresAt) > now)
        .first();
      
      if (!entry) return null;
      
      return entry.data as T;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      await db.cache.where('key').equals(key).delete();
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  }

  async cleanExpiredCache(): Promise<number> {
    try {
      const now = new Date();
      return await db.cache.where('expiresAt').below(now).delete();
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
      return 0;
    }
  }

  // 统计信息
  async getStorageStats(): Promise<StorageStats> {
    try {
      const [games, alerts, priceHistory, notifications, cache] = await Promise.all([
        db.games.count(),
        db.alerts.count(),
        db.priceHistory.count(),
        db.notifications.count(),
        db.cache.count(),
      ]);

      // 估算存储大小（简化版本）
      const totalItems = games + alerts + priceHistory + notifications + cache;
      const estimatedSize = totalItems * 1000; // 每条记录约1KB

      return {
        totalSize: estimatedSize,
        usedSize: estimatedSize,
        availableSize: Math.max(0, 50 * 1024 * 1024 - estimatedSize), // 假设50MB限制
        itemCounts: {
          games,
          alerts,
          priceHistory,
          notifications,
          cache,
        },
        oldestEntry: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
        newestEntry: new Date(),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new Error('获取存储统计失败');
    }
  }

  // 数据导出
  async exportData(): Promise<BackupData> {
    try {
      const [games, alerts, priceHistory, notifications, settings] = await Promise.all([
        db.games.toArray(),
        db.alerts.toArray(),
        db.priceHistory.toArray(),
        db.notifications.toArray(),
        db.settings.toArray(),
      ]);

      const data = {
        games,
        alerts,
        priceHistory,
        notifications,
        settings,
      };

      const totalItems = games.length + alerts.length + priceHistory.length + notifications.length + settings.length;
      const dataStr = JSON.stringify(data);
      const dataSize = new Blob([dataStr]).size;
      
      // 简单的校验和
      const checksum = btoa(dataStr).slice(0, 16);

      return {
        version: '1.0.0',
        exportedAt: new Date(),
        data,
        metadata: {
          totalItems,
          dataSize,
          checksum,
        },
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('导出数据失败');
    }
  }

  // 数据导入
  async importData(backupData: BackupData): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        imported: {
          games: 0,
          alerts: 0,
          priceHistory: 0,
          notifications: 0,
          settings: 0,
        },
        errors: [],
        warnings: [],
        duplicatesSkipped: 0,
      };

      await db.transaction('rw', [db.games, db.alerts, db.priceHistory, db.notifications, db.settings], async () => {
        // 导入游戏
        for (const game of backupData.data.games) {
          try {
            const existing = await db.games.where('steamId').equals(game.steamId).first();
            if (!existing) {
              await db.games.add(game);
              result.imported.games++;
            } else {
              result.duplicatesSkipped++;
            }
          } catch (error) {
            result.errors.push(`导入游戏失败: ${game.name}`);
          }
        }

        // 导入其他数据...
        // (类似的逻辑)

        result.success = result.errors.length === 0;
      });

      return result;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('导入数据失败');
    }
  }

  // 清除所有数据
  async clearAllData(): Promise<void> {
    try {
      await db.delete();
      await db.open();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('清除数据失败');
    }
  }
}

// 导出单例实例
export const storageService = StorageService.getInstance(); 