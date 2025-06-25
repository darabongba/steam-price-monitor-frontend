import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceAlert } from '@/types/alert';
import { GamePrice } from '@/types/game';
import { useAlertStore } from '@/stores/alertStore';
import { staticDataService } from '@/services/staticDataService.ts';
import { PRICE_CHECK_INTERVAL } from '@/utils/constants';

interface UsePriceMonitorOptions {
  enabled?: boolean;
  interval?: number;
  onPriceUpdate?: (alert: PriceAlert, price: GamePrice) => void;
  onPriceTarget?: (alert: PriceAlert, price: GamePrice) => void;
}

interface UsePriceMonitorReturn {
  isMonitoring: boolean;
  lastCheck: Date | null;
  nextCheck: Date | null;
  start: () => void;
  stop: () => void;
  checkNow: () => Promise<void>;
  error: string | null;
}

export function usePriceMonitor(options: UsePriceMonitorOptions = {}): UsePriceMonitorReturn {
  const {
    enabled = true,
    interval = PRICE_CHECK_INTERVAL,
    onPriceUpdate,
    onPriceTarget,
  } = options;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const { alerts, checkPrices } = useAlertStore();

  // 检查价格的核心逻辑
  const performPriceCheck = useCallback(async () => {
    try {
      setError(null);
      setLastCheck(new Date());

      const activeAlerts = alerts.filter(alert => alert.isActive && !alert.triggered);

      for (const alert of activeAlerts) {
        try {
          const currentPrice = await staticDataService.getGamePrice(alert.steamId);

          if (currentPrice) {
            // 调用价格更新回调
            onPriceUpdate?.(alert, currentPrice);

            // 检查是否达到目标价格
            if (currentPrice.final <= alert.targetPrice && !alert.triggered) {
              onPriceTarget?.(alert, currentPrice);
            }
          }
        } catch (priceError) {
          console.error(`Failed to check price for alert ${alert.id}:`, priceError);
        }
      }

      // 使用store的检查方法
      await checkPrices();

      // 设置下次检查时间
      setNextCheck(new Date(Date.now() + interval));
    } catch (err) {
      setError(err instanceof Error ? err.message : '价格检查失败');
    }
  }, [alerts, interval, onPriceUpdate, onPriceTarget, checkPrices]);

  // 立即检查价格
  const checkNow = useCallback(async () => {
    await performPriceCheck();
  }, [performPriceCheck]);

  // 开始监控
  const start = useCallback(() => {
    if (isMonitoring || !enabled) return;

    setIsMonitoring(true);
    setError(null);

    // 立即执行一次检查
    performPriceCheck();

    // 设置定时器
    intervalRef.current = setInterval(performPriceCheck, interval);
  }, [isMonitoring, enabled, performPriceCheck, interval]);

  // 停止监控
  const stop = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);
    setNextCheck(null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isMonitoring]);

  // 当配置改变时重启监控
  useEffect(() => {
    if (isMonitoring) {
      stop();
      if (enabled) {
        start();
      }
    }
  }, [interval, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // 自动启动监控
  useEffect(() => {
    if (enabled && alerts.length > 0) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, alerts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时不停止监控，但可以记录状态
      } else {
        // 页面显示时，如果需要立即检查
        if (isMonitoring && nextCheck && new Date() > nextCheck) {
          performPriceCheck();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMonitoring, nextCheck, performPriceCheck]);

  return {
    isMonitoring,
    lastCheck,
    nextCheck,
    start,
    stop,
    checkNow,
    error,
  };
}