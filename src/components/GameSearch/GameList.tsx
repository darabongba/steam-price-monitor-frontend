import React from 'react';
import { Game } from '@/types/game';
import GameCard from './GameCard';

interface GameListProps {
  games: Game[];
}

const GameList: React.FC<GameListProps> = ({ games }) => {
  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard key={game.steamId} game={game} compact />
      ))}
    </div>
  );
};

export default GameList; 