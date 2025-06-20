import emailjs from '@emailjs/browser';
import { PriceAlert } from '@/types/alert';
import { Game, GamePrice } from '@/types/game';
import { EMAIL_TEMPLATES, LIMITS } from '@/utils/constants';

// 邮件服务类
export class EmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private initialized: boolean = false;

  constructor() {
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    this.templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
  }

  // 初始化EmailJS
  async initialize(): Promise<void> {
    try {
      if (!this.serviceId || !this.templateId || !this.publicKey) {
        throw new Error('EmailJS配置不完整');
      }

      emailjs.init(this.publicKey);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      throw new Error('邮件服务初始化失败');
    }
  }

  // 发送价格提醒邮件
  async sendPriceAlert(
    alert: PriceAlert,
    game: Game,
    currentPrice: GamePrice,
    userEmail: string
  ): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const templateParams = {
        to_email: userEmail,
        game_name: game.name,
        game_image: game.headerImage || game.imageUrl,
        current_price: currentPrice.formatted,
        target_price: `¥${alert.targetPrice}`,
        discount_percent: currentPrice.discountPercent || 0,
        original_price: currentPrice.originalPrice > 0 ? `¥${currentPrice.originalPrice}` : '',
        steam_url: `https://store.steampowered.com/app/${game.steamId}`,
        alert_created_date: alert.createdAt.toLocaleDateString('zh-CN'),
        subject: `🎮 ${game.name} 已达到目标价格！`,
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      if (response.status === 200) {
        console.log('Price alert email sent successfully');
        return true;
      } else {
        throw new Error(`EmailJS响应错误: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send price alert email:', error);
      return false;
    }
  }

  // 发送批量价格提醒邮件
  async sendBatchPriceAlerts(
    alerts: Array<{
      alert: PriceAlert;
      game: Game;
      currentPrice: GamePrice;
    }>,
    userEmail: string
  ): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 限制批量发送数量
    const batchSize = LIMITS.EMAIL_BATCH_SIZE;
    const batches = [];

    for (let i = 0; i < alerts.length; i += batchSize) {
      batches.push(alerts.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async ({ alert, game, currentPrice }) => {
        try {
          const success = await this.sendPriceAlert(alert, game, currentPrice, userEmail);
          if (success) {
            result.success++;
          } else {
            result.failed++;
            result.errors.push(`发送 ${game.name} 价格提醒失败`);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`发送 ${game.name} 价格提醒时出错: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      });

      await Promise.all(batchPromises);

      // 批次间延迟，避免API限制
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(2000);
      }
    }

    return result;
  }

  // 发送每日摘要邮件
  async sendDailySummary(
    userEmail: string,
    data: {
      totalAlerts: number;
      activeAlerts: number;
      triggeredToday: number;
      newDeals: Array<{
        game: Game;
        price: GamePrice;
      }>;
      priceChanges: Array<{
        game: Game;
        oldPrice: number;
        newPrice: number;
        change: number;
      }>;
    }
  ): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const templateParams = {
        to_email: userEmail,
        total_alerts: data.totalAlerts,
        active_alerts: data.activeAlerts,
        triggered_today: data.triggeredToday,
        new_deals_count: data.newDeals.length,
        price_changes_count: data.priceChanges.length,
        new_deals: data.newDeals.map(item => ({
          name: item.game.name,
          price: item.price.formatted,
          discount: item.price.discountPercent || 0,
          url: `https://store.steampowered.com/app/${item.game.steamId}`,
        })),
        price_changes: data.priceChanges.map(item => ({
          name: item.game.name,
          old_price: `¥${item.oldPrice}`,
          new_price: `¥${item.newPrice}`,
          change: item.change > 0 ? `+¥${item.change}` : `-¥${Math.abs(item.change)}`,
          url: `https://store.steampowered.com/app/${item.game.steamId}`,
        })),
        date: new Date().toLocaleDateString('zh-CN'),
        subject: `📊 Steam 价格监控日报 - ${new Date().toLocaleDateString('zh-CN')}`,
      };

      const response = await emailjs.send(
        this.serviceId,
        EMAIL_TEMPLATES.DAILY_SUMMARY,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Failed to send daily summary email:', error);
      return false;
    }
  }

  // 发送测试邮件
  async sendTestEmail(userEmail: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const templateParams = {
        to_email: userEmail,
        subject: '🧪 Steam 价格监控 - 测试邮件',
        message: '这是一封测试邮件，用于验证邮件服务配置是否正确。',
        test_time: new Date().toLocaleString('zh-CN'),
      };

      const response = await emailjs.send(
        this.serviceId,
        EMAIL_TEMPLATES.TEST,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const templateParams = {
        to_email: userEmail,
        user_name: userName || '用户',
        app_name: 'Steam 价格监控',
        features: [
          '实时价格监控',
          '价格达标提醒',
          '价格历史图表',
          '每日摘要报告',
          '折扣游戏推荐',
        ],
        tips: [
          '设置合理的目标价格，避免错过好价',
          '定期检查和清理不需要的价格提醒',
          '关注愿望单中的游戏价格变化',
          '利用历史价格数据做出购买决策',
        ],
        subject: `🎮 欢迎使用 Steam 价格监控！`,
        signup_date: new Date().toLocaleDateString('zh-CN'),
      };

      const response = await emailjs.send(
        this.serviceId,
        EMAIL_TEMPLATES.WELCOME,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  // 验证邮箱地址格式
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证邮件服务配置
  async validateConfiguration(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!this.serviceId) {
      errors.push('EmailJS Service ID 未配置');
    }

    if (!this.templateId) {
      errors.push('EmailJS Template ID 未配置');
    }

    if (!this.publicKey) {
      errors.push('EmailJS Public Key 未配置');
    }

    // 尝试初始化
    try {
      if (errors.length === 0) {
        await this.initialize();
      }
    } catch (error) {
      errors.push('EmailJS 初始化失败');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // 获取邮件模板预览
  generateEmailPreview(
    type: 'price_alert' | 'daily_summary' | 'welcome',
    data: any
  ): string {
    switch (type) {
      case 'price_alert':
        return this.generatePriceAlertPreview(data);
      case 'daily_summary':
        return this.generateDailySummaryPreview(data);
      case 'welcome':
        return this.generateWelcomePreview(data);
      default:
        return '预览不可用';
    }
  }

  // 生成价格提醒邮件预览
  private generatePriceAlertPreview(data: {
    gameName: string;
    currentPrice: string;
    targetPrice: string;
    discountPercent: number;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">🎮 价格提醒</h2>
        <p>您关注的游戏 <strong>${data.gameName}</strong> 已达到目标价格！</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>当前价格:</strong> ${data.currentPrice}</p>
          <p><strong>目标价格:</strong> ${data.targetPrice}</p>
          <p><strong>折扣:</strong> ${data.discountPercent}%</p>
        </div>
        <p>快去 Steam 商店查看吧！</p>
      </div>
    `;
  }

  // 生成每日摘要邮件预览
  private generateDailySummaryPreview(data: {
    totalAlerts: number;
    activeAlerts: number;
    triggeredToday: number;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">📊 每日价格监控摘要</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>总提醒数:</strong> ${data.totalAlerts}</p>
          <p><strong>活跃提醒:</strong> ${data.activeAlerts}</p>
          <p><strong>今日触发:</strong> ${data.triggeredToday}</p>
        </div>
        <p>查看完整报告了解更多详情。</p>
      </div>
    `;
  }

  // 生成欢迎邮件预览
  private generateWelcomePreview(data: { userName: string }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">🎮 欢迎使用 Steam 价格监控</h2>
        <p>Hi ${data.userName}，</p>
        <p>感谢您注册我们的价格监控服务！现在您可以：</p>
        <ul>
          <li>监控游戏价格变化</li>
          <li>设置价格提醒</li>
          <li>获取折扣通知</li>
          <li>查看价格历史</li>
        </ul>
        <p>开始监控您喜欢的游戏吧！</p>
      </div>
    `;
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取服务状态
  getStatus(): {
    initialized: boolean;
    configured: boolean;
  } {
    return {
      initialized: this.initialized,
      configured: !!(this.serviceId && this.templateId && this.publicKey),
    };
  }
}

// 导出单例实例
export const emailService = new EmailService(); 