import { CURRENCIES, DEFAULT_CURRENCY } from './constants';

// 价格格式化选项
export interface PriceFormatOptions {
  currency?: string;
  showSymbol?: boolean;
  showCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// 格式化价格
export const formatPrice = (
  price: number,
  options: PriceFormatOptions = {}
): string => {
  const {
    currency = DEFAULT_CURRENCY,
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  try {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || '$';
    
    const formattedNumber = price.toLocaleString('zh-CN', {
      minimumFractionDigits,
      maximumFractionDigits,
    });

    let result = '';
    
    if (showSymbol) {
      result += symbol;
    }
    
    result += formattedNumber;
    
    if (showCode) {
      result += ` ${currency}`;
    }

    return result;
  } catch (error) {
    console.error('Price formatting error:', error);
    return `${price}`;
  }
};

// 计算折扣百分比
export const calculateDiscountPercent = (
  originalPrice: number,
  currentPrice: number
): number => {
  if (originalPrice <= 0 || currentPrice < 0) {
    return 0;
  }
  
  if (currentPrice >= originalPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// 计算节省金额
export const calculateSavings = (
  originalPrice: number,
  currentPrice: number
): number => {
  if (originalPrice <= 0 || currentPrice < 0) {
    return 0;
  }
  
  return Math.max(0, originalPrice - currentPrice);
};

// 价格比较
export const comparePrices = (
  price1: number,
  price2: number,
  threshold: number = 0.01
): 'higher' | 'lower' | 'equal' => {
  const diff = Math.abs(price1 - price2);
  
  if (diff <= threshold) {
    return 'equal';
  }
  
  return price1 > price2 ? 'higher' : 'lower';
};

// 检查价格是否触发提醒
export const isPriceTriggered = (
  currentPrice: number,
  targetPrice: number,
  tolerance: number = 0
): boolean => {
  return currentPrice <= (targetPrice + tolerance);
};

// 格式化折扣百分比
export const formatDiscountPercent = (percent: number): string => {
  if (percent <= 0) {
    return '';
  }
  
  return `-${percent}%`;
};

// 解析Steam价格（从cents转换为元）
export const parseSteamPrice = (priceInCents: number): number => {
  return priceInCents / 100;
};

// 转换价格为Steam格式（元转换为cents）
export const toSteamPrice = (price: number): number => {
  return Math.round(price * 100);
};

// 验证价格输入
export const validatePrice = (price: string | number): {
  isValid: boolean;
  value: number;
  error?: string;
} => {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
      return {
        isValid: false,
        value: 0,
        error: '请输入有效的数字',
      };
    }
    
    if (numPrice < 0) {
      return {
        isValid: false,
        value: numPrice,
        error: '价格不能为负数',
      };
    }
    
    if (numPrice > 999999) {
      return {
        isValid: false,
        value: numPrice,
        error: '价格过高',
      };
    }
    
    return {
      isValid: true,
      value: numPrice,
    };
  } catch (error) {
    return {
      isValid: false,
      value: 0,
      error: '价格格式错误',
    };
  }
};

// 计算价格变化百分比
export const calculatePriceChangePercent = (
  oldPrice: number,
  newPrice: number
): number => {
  if (oldPrice <= 0) {
    return 0;
  }
  
  return Math.round(((newPrice - oldPrice) / oldPrice) * 100);
};

// 获取价格变化描述
export const getPriceChangeDescription = (
  oldPrice: number,
  newPrice: number,
  currency: string = DEFAULT_CURRENCY
): string => {
  const changePercent = calculatePriceChangePercent(oldPrice, newPrice);
  const changeAmount = newPrice - oldPrice;
  
  if (changeAmount === 0) {
    return '价格无变化';
  } else if (changeAmount > 0) {
    return `价格上涨 ${formatPrice(changeAmount, { currency })} (${changePercent}%)`;
  } else {
    return `价格下降 ${formatPrice(Math.abs(changeAmount), { currency })} (${Math.abs(changePercent)}%)`;
  }
};

// 格式化价格范围
export const formatPriceRange = (
  minPrice: number,
  maxPrice: number,
  currency: string = DEFAULT_CURRENCY
): string => {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, { currency });
  }
  
  return `${formatPrice(minPrice, { currency })} - ${formatPrice(maxPrice, { currency })}`;
};

// 计算平均价格
export const calculateAveragePrice = (prices: number[]): number => {
  if (prices.length === 0) {
    return 0;
  }
  
  const sum = prices.reduce((acc, price) => acc + price, 0);
  return sum / prices.length;
};

// 获取价格统计信息
export const getPriceStats = (prices: number[]) => {
  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      count: 0,
    };
  }
  
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  return {
    min: sortedPrices[0],
    max: sortedPrices[sortedPrices.length - 1],
    average: calculateAveragePrice(prices),
    count: prices.length,
  };
};

// 检查价格是否为免费
export const isFreePrice = (price: number): boolean => {
  return price === 0;
};

// 格式化免费价格
export const formatFreePrice = (): string => {
  return '免费';
};

// 根据货币代码获取货币符号
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '$';
};

// 根据货币代码获取货币名称
export const getCurrencyName = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || '未知货币';
}; 