export interface UserSettings {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  notifications: {
    enabled: boolean;
    types: NotificationType[];
    frequency: AlertFrequency;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
    dateFormat: string;
    priceFormat: string;
    maxAlerts: number;
  };
  emailjs: {
    serviceId: string;
    templateId: string;
    userId: string;
    configured: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserProfile {
  email: string;
  name?: string;
  avatar?: string;
  totalAlerts: number;
  activeAlerts: number;
  totalSavings: number;
  joinedAt: Date;
  lastActivity: Date;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  userId: string;
  email: string;
  configured: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  frequency: AlertFrequency;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  types: NotificationType[];
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface AppPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  dateFormat: string;
  priceFormat: string;
  maxAlerts: number;
  autoRefresh: boolean;
  refreshInterval: number;
  showDiscountBadge: boolean;
  compactView: boolean;
}

export type NotificationType = 'email' | 'browser' | 'both';
export type AlertFrequency = 'hourly' | 'daily' | 'weekly'; 