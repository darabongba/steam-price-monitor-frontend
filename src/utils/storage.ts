// 本地存储工具函数
export const storage = {
  // 获取数据
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        return defaultValue || null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`Failed to get item from localStorage: ${key}`, error);
      return defaultValue || null;
    }
  },

  // 设置数据
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set item to localStorage: ${key}`, error);
      return false;
    }
  },

  // 删除数据
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  },

  // 清空所有数据
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage', error);
      return false;
    }
  },

  // 获取所有键
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Failed to get all keys from localStorage', error);
      return [];
    }
  },

  // 获取存储大小（字节）
  getSize(): number {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      console.error('Failed to calculate localStorage size', error);
      return 0;
    }
  },

  // 检查是否支持本地存储
  isSupported(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
};

// 会话存储工具函数
export const sessionStorage = {
  // 获取数据
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const value = window.sessionStorage.getItem(key);
      if (value === null) {
        return defaultValue || null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`Failed to get item from sessionStorage: ${key}`, error);
      return defaultValue || null;
    }
  },

  // 设置数据
  set<T>(key: string, value: T): boolean {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set item to sessionStorage: ${key}`, error);
      return false;
    }
  },

  // 删除数据
  remove(key: string): boolean {
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item from sessionStorage: ${key}`, error);
      return false;
    }
  },

  // 清空所有数据
  clear(): boolean {
    try {
      window.sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear sessionStorage', error);
      return false;
    }
  }
};

// 加密存储工具（用于敏感数据）
export const secureStorage = {
  // 简单的加密函数（生产环境应使用更强的加密）
  encrypt(text: string, key: string = 'default'): string {
    try {
      // 这里使用简单的Base64编码，生产环境应使用crypto-js等库
      return btoa(text + key);
    } catch (error) {
      console.error('Failed to encrypt data', error);
      return text;
    }
  },

  // 简单的解密函数
  decrypt(encryptedText: string, key: string = 'default'): string {
    try {
      const decoded = atob(encryptedText);
      return decoded.substring(0, decoded.length - key.length);
    } catch (error) {
      console.error('Failed to decrypt data', error);
      return encryptedText;
    }
  },

  // 安全存储
  setSecure<T>(key: string, value: T, encryptionKey?: string): boolean {
    try {
      const encrypted = this.encrypt(JSON.stringify(value), encryptionKey);
      return storage.set(key, encrypted);
    } catch (error) {
      console.error(`Failed to set secure item: ${key}`, error);
      return false;
    }
  },

  // 安全获取
  getSecure<T>(key: string, defaultValue?: T, encryptionKey?: string): T | null {
    try {
      const encrypted = storage.get<string>(key);
      if (!encrypted) {
        return defaultValue || null;
      }
      const decrypted = this.decrypt(encrypted, encryptionKey);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`Failed to get secure item: ${key}`, error);
      return defaultValue || null;
    }
  }
};

// 缓存工具
export const cache = {
  // 设置带过期时间的缓存
  set<T>(key: string, value: T, ttl: number = 3600000): boolean {
    const cacheData = {
      value,
      expiredAt: Date.now() + ttl,
      createdAt: Date.now()
    };
    return storage.set(key, cacheData);
  },

  // 获取缓存数据
  get<T>(key: string, defaultValue?: T): T | null {
    const cacheData = storage.get<{
      value: T;
      expiredAt: number;
      createdAt: number;
    }>(key);

    if (!cacheData) {
      return defaultValue || null;
    }

    // 检查是否过期
    if (Date.now() > cacheData.expiredAt) {
      storage.remove(key);
      return defaultValue || null;
    }

    return cacheData.value;
  },

  // 检查缓存是否存在且有效
  has(key: string): boolean {
    const cacheData = storage.get<{
      expiredAt: number;
    }>(key);

    if (!cacheData) {
      return false;
    }

    if (Date.now() > cacheData.expiredAt) {
      storage.remove(key);
      return false;
    }

    return true;
  },

  // 清理过期缓存
  cleanExpired(): number {
    let cleaned = 0;
    const keys = storage.getAllKeys();
    
    keys.forEach(key => {
      const cacheData = storage.get<{
        expiredAt: number;
      }>(key);
      
      if (cacheData && Date.now() > cacheData.expiredAt) {
        storage.remove(key);
        cleaned++;
      }
    });

    return cleaned;
  },

  // 获取缓存统计信息
  getStats() {
    const keys = storage.getAllKeys();
    let validCount = 0;
    let expiredCount = 0;
    let totalSize = 0;

    keys.forEach(key => {
      const cacheData = storage.get<{
        expiredAt: number;
      }>(key);
      
      if (cacheData) {
        totalSize += JSON.stringify(cacheData).length;
        
        if (Date.now() > cacheData.expiredAt) {
          expiredCount++;
        } else {
          validCount++;
        }
      }
    });

    return {
      total: keys.length,
      valid: validCount,
      expired: expiredCount,
      size: totalSize
    };
  }
}; 