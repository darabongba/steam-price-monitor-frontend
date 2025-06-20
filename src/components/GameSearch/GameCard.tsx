import React from 'react';
import { Star, Plus, Bell } from 'lucide-react';
import { Game } from '@/types/game';
import { useAlertStore } from '@/stores/alertStore';
import { formatPrice } from '@/utils/priceUtils';
import Button from '@/components/common/Button';

interface GameCardProps {
  game: Game;
  compact?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, compact = false }) => {
  const { createAlert, hasAlert } = useAlertStore();
  const hasExistingAlert = hasAlert(game.id);

  const handleCreateAlert = () => {
    createAlert({
      gameId: game.id,
      gameName: game.name,
      targetPrice: game.price?.current ? game.price.current * 0.8 : 0,
      currentPrice: game.price?.current || 0,
      emailEnabled: true,
      pushEnabled: true,
    });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                {formatPrice(game.price.current, { currency: 'CNY' })}
              </span>
            )}
            {game.rating && (
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                  {game.rating}
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={hasExistingAlert ? "outline" : "primary"}
          onClick={handleCreateAlert}
          disabled={hasExistingAlert}
          icon={hasExistingAlert ? <Bell className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        >
          {hasExistingAlert ? '已设置' : '提醒'}
        </Button>
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
        {game.price?.discount && game.price.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{game.price.discount}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {game.name}
        </h3>
        
        {game.shortDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {game.shortDescription}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          {game.price ? (
            <div className="flex items-center space-x-2">
              {game.price.discount && game.price.discount > 0 ? (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                    {formatPrice(game.price.original, { currency: 'CNY' })}
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatPrice(game.price.current, { currency: 'CNY' })}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(game.price.current, { currency: 'CNY' })}
                </span>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              免费
            </span>
          )}
          
          {game.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                {game.rating}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            className="flex-1"
            variant={hasExistingAlert ? "outline" : "primary"}
            onClick={handleCreateAlert}
            disabled={hasExistingAlert}
            icon={hasExistingAlert ? <Bell className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {hasExistingAlert ? '已设置提醒' : '设置提醒'}
          </Button>
        </div>
        
        {game.tags && game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {game.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCard; 