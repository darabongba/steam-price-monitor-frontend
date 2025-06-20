// 验证工具函数

// 邮箱验证
export const validateEmail = (email: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: '邮箱地址不能为空',
    };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      error: '邮箱地址不能为空',
    };
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: '请输入有效的邮箱地址',
    };
  }

  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: '邮箱地址过长',
    };
  }

  return {
    isValid: true,
  };
};

// Steam游戏ID验证
export const validateSteamId = (steamId: string | number): {
  isValid: boolean;
  error?: string;
  steamId?: string;
} => {
  if (!steamId) {
    return {
      isValid: false,
      error: 'Steam ID不能为空',
    };
  }

  const idStr = String(steamId).trim();
  
  if (idStr.length === 0) {
    return {
      isValid: false,
      error: 'Steam ID不能为空',
    };
  }

  // Steam App ID通常是数字
  const idNumber = parseInt(idStr, 10);
  
  if (isNaN(idNumber)) {
    return {
      isValid: false,
      error: 'Steam ID必须是数字',
    };
  }

  if (idNumber <= 0) {
    return {
      isValid: false,
      error: 'Steam ID必须大于0',
    };
  }

  if (idNumber > 9999999) {
    return {
      isValid: false,
      error: 'Steam ID格式错误',
    };
  }

  return {
    isValid: true,
    steamId: idStr,
  };
};

// 价格验证
export const validatePrice = (price: string | number): {
  isValid: boolean;
  value: number;
  error?: string;
} => {
  if (price === '' || price === null || price === undefined) {
    return {
      isValid: false,
      value: 0,
      error: '价格不能为空',
    };
  }

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

  // 检查小数位数
  const decimalStr = String(numPrice);
  const decimalIndex = decimalStr.indexOf('.');
  if (decimalIndex !== -1 && decimalStr.length - decimalIndex - 1 > 2) {
    return {
      isValid: false,
      value: numPrice,
      error: '价格最多支持2位小数',
    };
  }
  
  return {
    isValid: true,
    value: numPrice,
  };
};

// URL验证
export const validateUrl = (url: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL不能为空',
    };
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    return {
      isValid: false,
      error: 'URL不能为空',
    };
  }

  try {
    new URL(trimmedUrl);
    return {
      isValid: true,
    };
  } catch {
    return {
      isValid: false,
      error: '请输入有效的URL',
    };
  }
};

// 游戏名称验证
export const validateGameName = (name: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: '游戏名称不能为空',
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: '游戏名称不能为空',
    };
  }

  if (trimmedName.length > 200) {
    return {
      isValid: false,
      error: '游戏名称过长',
    };
  }

  return {
    isValid: true,
  };
};

// 时间间隔验证
export const validateInterval = (interval: number): {
  isValid: boolean;
  error?: string;
} => {
  if (typeof interval !== 'number' || isNaN(interval)) {
    return {
      isValid: false,
      error: '时间间隔必须是数字',
    };
  }

  if (interval <= 0) {
    return {
      isValid: false,
      error: '时间间隔必须大于0',
    };
  }

  // 最小间隔10分钟
  const minInterval = 10 * 60 * 1000;
  if (interval < minInterval) {
    return {
      isValid: false,
      error: '时间间隔不能少于10分钟',
    };
  }

  // 最大间隔30天
  const maxInterval = 30 * 24 * 60 * 60 * 1000;
  if (interval > maxInterval) {
    return {
      isValid: false,
      error: '时间间隔不能超过30天',
    };
  }

  return {
    isValid: true,
  };
};

// 字符串长度验证
export const validateStringLength = (
  str: string,
  minLength: number = 0,
  maxLength: number = 1000,
  fieldName: string = '字段'
): {
  isValid: boolean;
  error?: string;
} => {
  if (typeof str !== 'string') {
    return {
      isValid: false,
      error: `${fieldName}必须是字符串`,
    };
  }

  const trimmedStr = str.trim();
  
  if (trimmedStr.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName}长度不能少于${minLength}个字符`,
    };
  }

  if (trimmedStr.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName}长度不能超过${maxLength}个字符`,
    };
  }

  return {
    isValid: true,
  };
};

// 数字范围验证
export const validateNumberRange = (
  num: number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  fieldName: string = '数值'
): {
  isValid: boolean;
  error?: string;
} => {
  if (typeof num !== 'number' || isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName}必须是有效数字`,
    };
  }

  if (num < min) {
    return {
      isValid: false,
      error: `${fieldName}不能小于${min}`,
    };
  }

  if (num > max) {
    return {
      isValid: false,
      error: `${fieldName}不能大于${max}`,
    };
  }

  return {
    isValid: true,
  };
};

// 必填字段验证
export const validateRequired = (
  value: any,
  fieldName: string = '字段'
): {
  isValid: boolean;
  error?: string;
} => {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: `${fieldName}是必填项`,
    };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName}不能为空`,
    };
  }

  if (Array.isArray(value) && value.length === 0) {
    return {
      isValid: false,
      error: `${fieldName}不能为空`,
    };
  }

  return {
    isValid: true,
  };
};

// 批量验证
export const validateFields = (
  fields: Array<{
    value: any;
    validators: Array<(value: any) => { isValid: boolean; error?: string }>;
    fieldName: string;
  }>
): {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
} => {
  const errors: Record<string, string> = {};
  let firstError: string | undefined;

  fields.forEach(({ value, validators, fieldName }) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        errors[fieldName] = result.error || '验证失败';
        if (!firstError) {
          firstError = result.error;
        }
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
};

// 邮箱JS配置验证
export const validateEmailJSConfig = (config: {
  serviceId: string;
  templateId: string;
  userId: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!config.serviceId || config.serviceId.trim().length === 0) {
    errors.serviceId = 'Service ID不能为空';
  }

  if (!config.templateId || config.templateId.trim().length === 0) {
    errors.templateId = 'Template ID不能为空';
  }

  if (!config.userId || config.userId.trim().length === 0) {
    errors.userId = 'User ID不能为空';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}; 