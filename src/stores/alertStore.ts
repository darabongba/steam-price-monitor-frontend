import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PriceAlert, AlertFormData, AlertNotification } from '@/types/alert';
import { storageService } from '@/services/storageService';
import { staticDataService } from '@/services/staticDataService.ts';

interface AlertState {
  // 状态
  alerts: PriceAlert[];
  notifications: AlertNotification[];
  loading: boolean;
  error: string | null;
  checkingPrices: boolean;

  // 统计信息
  stats: {
    total: number;
    active: number;
    triggered: number;
    paused: number;
  };

  // 操作
  loadAlerts: () => Promise<void>;
  createAlert: (alertData: AlertFormData) => Promise<void>;
  updateAlert: (id: string, updates: Partial<PriceAlert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  checkPrices: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearError: () => void;
  getAlertsByGame: (gameId: string) => PriceAlert[];
  hasAlert: (gameId: string) => boolean;
}

export const useAlertStore = create<AlertState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        alerts: [],
        notifications: [],
        loading: false,
        error: null,
        checkingPrices: false,
        stats: {
          total: 0,
          active: 0,
          triggered: 0,
          paused: 0,
        },

        // 加载所有提醒
        loadAlerts: async () => {
          set({ loading: true, error: null });

          try {
            const alerts = await storageService.getAllAlerts();
            const stats = {
              total: alerts.length,
              active: alerts.filter(alert => alert.isActive && !alert.triggered).length,
              triggered: alerts.filter(alert => alert.triggered).length,
              paused: alerts.filter(alert => !alert.isActive).length,
            };

            set({ alerts, stats, loading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '加载提醒失败',
              loading: false
            });
          }
        },

        // 创建新提醒
        createAlert: async (alertData: AlertFormData) => {
          set({ loading: true, error: null });

          try {
            // 验证游戏是否存在
            // const game = await storageService.getGame(alertData.gameId);
            // if (!game) {
            //   throw new Error('游戏不存在');
            // }

            // 检查是否已有相同的提醒
            const existingAlerts = get().alerts.filter(
              alert => alert.gameId === alertData.gameId && alert.isActive
            );

            if (existingAlerts.length > 0) {
              throw new Error('该游戏已有活跃的价格提醒');
            }

            const newAlert: Omit<PriceAlert, 'id'> = {
              gameId: alertData.gameId,
              steamId: alertData.steamId,
              gameName: alertData.gameName,
              gameImage: alertData.headerImage,
              targetPrice: alertData.targetPrice,
              currentPrice: alertData.currentPrice,
              originalPrice: alertData.currentPrice,
              currency: 'CNY',
              discountPercent: 0,
              isActive: true,
              triggered: false,
              notificationSent: false,
              userEmail: '', // 从用户设置中获取
              createdAt: new Date().toLocaleString(),
              updatedAt: new Date().toLocaleString(),
              nextCheckAt: new Date().toLocaleString(),
              checkCount: 0,
              lastPrice: alertData.currentPrice,
              checkInterval: 3600000, // 1小时
            };

            const alertId = await storageService.addAlert(newAlert);
            console.log('Created Alert:', alertId)
            const createdAlert = { ...newAlert, id: alertId };

            set(state => {
              const newAlerts = [...state.alerts, createdAlert];
              return {
                alerts: newAlerts,
                stats: {
                  total: newAlerts.length,
                  active: newAlerts.filter(a => a.isActive && !a.triggered).length,
                  triggered: newAlerts.filter(a => a.triggered).length,
                  paused: newAlerts.filter(a => !a.isActive).length,
                },
                loading: false,
              };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '创建提醒失败',
              loading: false
            });
          }
        },

        // 更新提醒
        updateAlert: async (id: string, updates: Partial<PriceAlert>) => {
          try {
            await storageService.updateAlert(id, updates);

            set(state => {
              const newAlerts = state.alerts.map(alert =>
                alert.id === id ? { ...alert, ...updates, updatedAt: new Date().toLocaleString() } : alert
              );

              return {
                alerts: newAlerts,
                stats: {
                  total: newAlerts.length,
                  active: newAlerts.filter(a => a.isActive && !a.triggered).length,
                  triggered: newAlerts.filter(a => a.triggered).length,
                  paused: newAlerts.filter(a => !a.isActive).length,
                },
                error: null,
              };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '更新提醒失败'
            });
          }
        },

        // 删除提醒
        deleteAlert: async (id: string) => {
          try {
            await storageService.deleteAlert(id);

            set(state => {
              const newAlerts = state.alerts.filter(alert => alert.id !== id);
              return {
                alerts: newAlerts,
                stats: {
                  total: newAlerts.length,
                  active: newAlerts.filter(a => a.isActive && !a.triggered).length,
                  triggered: newAlerts.filter(a => a.triggered).length,
                  paused: newAlerts.filter(a => !a.isActive).length,
                },
                error: null,
              };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '删除提醒失败'
            });
          }
        },

        // 切换提醒状态
        toggleAlert: async (id: string) => {
          const alert = get().alerts.find(a => a.id === id);
          if (!alert) return;

          await get().updateAlert(id, { isActive: !alert.isActive });
        },

        // 检查价格
        checkPrices: async () => {
          set({ checkingPrices: true, error: null });

          try {
            const alertsToCheck = await storageService.getAlertsForCheck();

            for (const alert of alertsToCheck) {
              try {
                const currentPrice = await staticDataService.getGamePrice(alert.steamId);

                if (currentPrice && currentPrice.final <= alert.targetPrice) {
                  // 价格达到目标，触发提醒
                  await get().updateAlert(alert.id, {
                    triggered: true,
                    triggeredAt: new Date().toLocaleString(),
                    lastPrice: currentPrice.final,
                    currentPrice: currentPrice.final,
                    updatedAt: new Date().toLocaleString(),
                  });

                  // 创建通知
                  const notification: Omit<AlertNotification, 'id'> = {
                    alertId: alert.id,
                    type: 'price_target_reached',
                    title: '价格提醒',
                    message: `${alert.gameName || '游戏'} 已达到目标价格 ¥${alert.targetPrice}`,
                    data: {
                      gameId: alert.gameId,
                      steamId: alert.steamId,
                      currentPrice: currentPrice.final,
                      targetPrice: alert.targetPrice,
                    },
                    sentAt: new Date().toLocaleString(),
                    read: false,
                  };

                  await storageService.addNotification(notification);

                  // 发送邮件通知（如果配置了）
                  // 这里可以添加邮件发送逻辑
                } else if (currentPrice) {
                  // 仅更新价格信息
                  await get().updateAlert(alert.id, {
                    lastPrice: currentPrice?.final || alert.lastPrice,
                    currentPrice: currentPrice.final,
                                         updatedAt: new Date().toLocaleString(),
                     nextCheckAt: new Date(Date.now() + alert.checkInterval).toLocaleString(),
                    checkCount: alert.checkCount + 1,
                  });
                }
              } catch (error) {
                console.error(`Failed to check price for alert ${alert.id}:`, error);
              }
            }

            // 重新加载提醒和通知
            await get().loadAlerts();
            await get().loadNotifications();

            set({ checkingPrices: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '价格检查失败',
              checkingPrices: false
            });
          }
        },

        // 加载通知
        loadNotifications: async () => {
          try {
            const notifications = await storageService.getNotifications();
            set({ notifications, error: null });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '加载通知失败'
            });
          }
        },

        // 标记通知为已读
        markNotificationAsRead: async (id: string) => {
          try {
            await storageService.markNotificationAsRead(id);

            set(state => ({
              notifications: state.notifications.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
              ),
              error: null,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '标记通知失败'
            });
          }
        },

        // 清除错误
        clearError: () => {
          set({ error: null });
        },

        // 根据游戏ID获取提醒
        getAlertsByGame: (gameId: string) => {
          return get().alerts.filter(alert => alert.gameId === gameId);
        },

        // 检查游戏是否有提醒
        hasAlert: (gameId: string) => {
          return get().alerts.some(alert => alert.gameId === gameId);
        },
      }),
      {
        name: 'alert-store',
        partialize: (state) => ({
          alerts: state.alerts,
          notifications: state.notifications,
          stats: state.stats,
        }),
      }
    ),
    {
      name: 'alert-store',
    }
  )
);