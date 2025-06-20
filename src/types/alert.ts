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
  isActive: boolean;
  triggered: boolean;
  notificationSent: boolean;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  triggeredAt?: Date;
  nextCheckAt: Date;
  checkCount: number;
  lastPrice: number;
  checkInterval: number;
  lastErrorMessage?: string;
}

export interface AlertFormData {
  gameId: string;
  gameName: string;
  targetPrice: number;
  currentPrice: number;
  emailEnabled: boolean;
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
  sentAt: Date;
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
  timestamp: Date;
  alertsTriggered: string[];
}

export type AlertStatus = 'active' | 'inactive' | 'triggered' | 'error';
export type AlertFrequency = 'hourly' | 'daily' | 'weekly';
export type NotificationType = 'email' | 'browser' | 'both'; 