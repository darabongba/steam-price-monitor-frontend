import { Game, PriceHistory } from './game';
import { PriceAlert, AlertNotification } from './alert';
import { UserSettings } from './user';

export interface DatabaseSchema {
  games: Game;
  alerts: PriceAlert;
  priceHistory: PriceHistory;
  notifications: AlertNotification;
  settings: UserSettings;
  cache: CacheEntry;
}

export interface CacheEntry {
  id: string;
  key: string;
  data: any;
  expiresAt: string;
  createdAt: string;
  tags: string[];
}

export interface StorageStats {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  itemCounts: {
    games: number;
    alerts: number;
    priceHistory: number;
    notifications: number;
    cache: number;
  };
  oldestEntry: Date;
  newestEntry: Date;
}

export interface BackupData {
  version: string;
  exportedAt: Date;
  data: {
    games: Game[];
    alerts: PriceAlert[];
    priceHistory: PriceHistory[];
    notifications: AlertNotification[];
    settings: UserSettings[];
  };
  metadata: {
    totalItems: number;
    dataSize: number;
    checksum: string;
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    games: number;
    alerts: number;
    priceHistory: number;
    notifications: number;
    settings: number;
  };
  errors: string[];
  warnings: string[];
  duplicatesSkipped: number;
}

export type StorageKey = keyof DatabaseSchema;
export type StorageOperation = 'get' | 'add' | 'update' | 'delete' | 'clear';

export interface StorageEvent {
  operation: StorageOperation;
  table: StorageKey;
  id?: string;
  data?: any;
  timestamp: Date;
}

export interface StorageError extends Error {
  table: StorageKey;
  operation: StorageOperation;
  id?: string;
  originalError?: Error;
} 