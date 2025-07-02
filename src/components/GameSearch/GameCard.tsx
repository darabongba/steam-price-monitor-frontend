import React, { useState } from 'react';
import { Star, Plus, Bell, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { Game } from '@/types/game';
import { useAlertStore } from '@/stores/alertStore';
import { formatPrice } from '@/utils/priceUtils';
import { validatePrice } from '@/utils/validators';
import Button from '@/components/common/Button';

interface GameCardProps {
  game: Game;
  compact?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, compact = false }) => {
  const { hasAlert, createAlert, loading } = useAlertStore();
  const [showAlertSetup, setShowAlertSetup] = useState(false);
  const [targetDiscountPercent, setTargetDiscountPercent] = useState(30);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customTargetPrice, setCustomTargetPrice] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(true);
  
  const hasExistingAlert = hasAlert(game.steamId);
  const currentPrice = game.price?.final || 0;
  
  // 计算基于折扣百分比的目标价格
  const discountTargetPrice = currentPrice * (1 - targetDiscountPercent / 100);
  const finalTargetPrice = useCustomPrice ? customTargetPrice : discountTargetPrice;

  const handleToggleAlertSetup = () => {
    if (hasExistingAlert) return;
    setShowAlertSetup(!showAlertSetup);
  };

  const handleCreateAlert = async () => {
    if (!useCustomPrice && (targetDiscountPercent < 1 || targetDiscountPercent > 99)) {
      alert('折扣百分比必须在 1% 到 99% 之间');
      return;
    }

    if (useCustomPrice) {
      const priceValidation = validatePrice(customTargetPrice);
      if (!priceValidation.isValid) {
        alert(priceValidation.error);
        return;
      }
    }

    try {
      await createAlert({
        gameId: game.steamId,
        steamId: game.steamId,
        gameName: game.name,
        headerImage: game.headerImage,
        targetPrice: finalTargetPrice,
        currentPrice: currentPrice,
        targetDiscountPercent: useCustomPrice ? undefined : targetDiscountPercent,
        pushEnabled,
      });
      
      setShowAlertSetup(false);
    } catch (error) {
      console.error('创建提醒失败:', error);
    }
  };

  if (compact) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center space-x-4 p-4">
          <img
            src={game.headerImage || '/placeholder-game.jpg'}
            alt={game.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-game.jpg';
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {game.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {game.price && (
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(game.price.final, { currency: 'CNY' })}
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant={hasExistingAlert ? "outline" : "primary"}
            onClick={handleToggleAlertSetup}
            disabled={hasExistingAlert}
            icon={hasExistingAlert ? <Bell className="w-4 h-4" /> : 
                  showAlertSetup ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {hasExistingAlert ? '已设置' : showAlertSetup ? '收起' : '提醒'}
          </Button>
        </div>

        {/* 手风琴式提醒设置区域 - compact 模式 */}
        {showAlertSetup && !hasExistingAlert && (
          <div className="mx-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-t border-gray-200 dark:border-gray-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* 提醒类型选择 */}
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">提醒类型</h5>
              
              <div className="space-y-1">
                <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`alertType-${game.steamId}-compact`}
                    checked={!useCustomPrice}
                    onChange={() => setUseCustomPrice(false)}
                    className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-1">
                    <Percent className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      按折扣百分比提醒
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`alertType-${game.steamId}-compact`}
                    checked={useCustomPrice}
                    onChange={() => setUseCustomPrice(true)}
                    className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-1">
                    <Bell className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      按目标价格提醒
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* 折扣百分比输入 */}
            {!useCustomPrice && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  目标折扣百分比
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={targetDiscountPercent}
                    onChange={(e) => setTargetDiscountPercent(Number(e.target.value))}
                    className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">%</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    = <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(discountTargetPrice)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* 自定义价格输入 */}
            {useCustomPrice && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  目标价格
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value))}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="输入目标价格"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">元</span>
                </div>
              </div>
            )}

            {/* 通知设置 */}
            <div className="flex items-center space-x-1">
              <input
                type="checkbox"
                id={`pushEnabled-${game.steamId}-compact`}
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="w-3 h-3 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`pushEnabled-${game.steamId}-compact`} className="text-xs text-gray-700 dark:text-gray-300">
                启用推送通知
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-1 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAlertSetup(false)}
                className="flex-1 text-xs py-1"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleCreateAlert}
                loading={loading}
                className="flex-1 text-xs py-1"
                icon={<Bell className="w-3 h-3" />}
              >
                创建提醒
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <img
          src={game.headerImage || '/placeholder-game.jpg'}
          alt={game.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-game.jpg';
          }}
        />
        {game.price?.discount_percent && game.price.discount_percent > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            -{game.price.discount_percent}%
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {game.name}
        </h3>

        {game.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {game.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          {game.price ? (
            <div className="flex items-center space-x-2">
              {game.price.discount_percent && game.price.discount_percent > 0 ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(game.price.initial, { currency: 'CNY' })}
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatPrice(game.price.final, { currency: 'CNY' })}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(game.price.final, { currency: 'CNY' })}
                </span>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              免费
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            className="flex-1"
            variant={hasExistingAlert ? "outline" : "primary"}
            onClick={handleToggleAlertSetup}
            disabled={hasExistingAlert}
            icon={hasExistingAlert ? <Bell className="w-4 h-4" /> : 
                  showAlertSetup ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {hasExistingAlert ? '已设置提醒' : showAlertSetup ? '收起设置' : '设置提醒'}
          </Button>
        </div>

        {/* 手风琴式提醒设置区域 */}
        {showAlertSetup && !hasExistingAlert && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-t border-gray-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* 提醒类型选择 */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">提醒类型</h5>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`alertType-${game.steamId}`}
                    checked={!useCustomPrice}
                    onChange={() => setUseCustomPrice(false)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      按折扣百分比提醒
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`alertType-${game.steamId}`}
                    checked={useCustomPrice}
                    onChange={() => setUseCustomPrice(true)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      按目标价格提醒
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* 折扣百分比输入 */}
            {!useCustomPrice && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  目标折扣百分比
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={targetDiscountPercent}
                    onChange={(e) => setTargetDiscountPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    = <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(discountTargetPrice)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* 自定义价格输入 */}
            {useCustomPrice && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  目标价格
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customTargetPrice}
                    onChange={(e) => setCustomTargetPrice(Number(e.target.value))}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="输入目标价格"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">元</span>
                </div>
              </div>
            )}

            {/* 通知设置 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`pushEnabled-${game.steamId}`}
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`pushEnabled-${game.steamId}`} className="text-sm text-gray-700 dark:text-gray-300">
                启用推送通知
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAlertSetup(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleCreateAlert}
                loading={loading}
                className="flex-1"
                icon={<Bell className="w-4 h-4" />}
              >
                创建提醒
              </Button>
            </div>
          </div>
        )}

        {game.metacriticScore && (
          <div className="flex items-center text-xs text-amber-600">
            <Star className="w-3 h-3 mr-1" />
            {game.metacriticScore}
          </div>
        )}

        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 3).map((genre: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default GameCard;