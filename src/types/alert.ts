export interface PriceAlert {
  id: string;
  gameId: string;
  steamId: string;
  gameName: string;
  gameImage: string;
  targetPrice: number;
  currentPrice: number;
  originalPrice: number;
  currency: string;
  discountPercent: number;
  targetDiscountPercent?: number;
  isActive: boolean;
  triggered: boolean;
  notificationSent: boolean;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  triggeredAt?: string;
  nextCheckAt: string;
  checkCount: number;
  lastPrice: number;
  checkInterval: number;
  lastErrorMessage?: string;
}

export interface AlertFormData {
  gameId: string;
  steamId: string;
  gameName: string;
  headerImage: string;
  targetPrice: number;
  currentPrice: number;
  targetDiscountPercent?: number;
  pushEnabled: boolean;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  type: 'price_drop' | 'sale_started' | 'sale_ending' | 'price_target_reached';
  title: string;
  message: string;
  gameImage?: string;
  currentPrice?: number;
  targetPrice?: number;
  discountPercent?: number;
  buyLink?: string;
  data?: any;
  sentAt: string;
  read: boolean;
}

export interface AlertStats {
  total: number;
  active: number;
  triggered: number;
  inactive: number;
  avgTargetPrice: number;
  totalSavings: number;
}

export interface PriceChange {
  gameId: string;
  steamId: string;
  gameName: string;
  oldPrice: number;
  newPrice: number;
  oldDiscount: number;
  newDiscount: number;
  priceChange: number;
  changePercent: number;
  timestamp: string;
  alertsTriggered: string[];
}

export type AlertStatus = 'active' | 'inactive' | 'triggered' | 'error';
export type AlertFrequency = 'hourly' | 'daily' | 'weekly';
export type NotificationType = 'email' | 'browser' | 'both';