import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Game, GameDetails, GameSearchResult } from '@/types/game';
import { steamService } from '@/services/steamService';
import { storageService } from '@/services/storageService';

interface GameState {
  // 状态
  games: Game[];
  searchResults: GameSearchResult | null;
  currentGame: GameDetails | null;
  popularGames: Game[];
  loading: boolean;
  error: string | null;
  searchLoading: boolean;
  
  // 操作
  searchGames: (query: string) => Promise<void>;
  loadGameDetails: (steamId: string) => Promise<void>;
  loadPopularGames: () => Promise<void>;
  addGame: (game: Game) => Promise<void>;
  updateGame: (id: string, updates: Partial<Game>) => Promise<void>;
  removeGame: (id: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  loadSavedGames: () => Promise<void>;
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set) => ({
        // 初始状态
        games: [],
        searchResults: null,
        currentGame: null,
        popularGames: [],
        loading: false,
        error: null,
        searchLoading: false,

        // 搜索游戏
        searchGames: async (query: string) => {
          if (!query.trim()) {
            set({ searchResults: null });
            return;
          }

          set({ searchLoading: true, error: null });
          
          try {
            const results = await steamService.searchGames(query);
            set({ searchResults: results, searchLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '搜索失败',
              searchLoading: false 
            });
          }
        },

        // 加载游戏详情
        loadGameDetails: async (steamId: string) => {
          set({ loading: true, error: null });
          
          try {
            const gameDetails = await steamService.getGameDetails(steamId);
            if (gameDetails) {
              set({ currentGame: gameDetails, loading: false });
            } else {
              set({ 
                error: '游戏详情加载失败',
                loading: false 
              });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '加载失败',
              loading: false 
            });
          }
        },

        // 加载热门游戏
        loadPopularGames: async () => {
          set({ loading: true, error: null });
          
          try {
            const popular = await steamService.getPopularGames();
            set({ popularGames: popular, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '加载热门游戏失败',
              loading: false 
            });
          }
        },

        // 添加游戏到收藏
        addGame: async (game: Game) => {
          try {
            // 检查是否已存在
            const existing = await storageService.getGameBySteamId(game.steamId);
            if (existing) {
              set({ error: '游戏已在监控列表中' });
              return;
            }

            const gameId = await storageService.addGame(game);
            const newGame = { ...game, id: gameId };
            
            set(state => ({
              games: [...state.games, newGame],
              error: null
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '添加游戏失败'
            });
          }
        },

        // 更新游戏信息
        updateGame: async (id: string, updates: Partial<Game>) => {
          try {
            await storageService.updateGame(id, updates);
            
            set(state => ({
              games: state.games.map(game => 
                game.id === id ? { ...game, ...updates } : game
              ),
              error: null
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '更新游戏失败'
            });
          }
        },

        // 移除游戏
        removeGame: async (id: string) => {
          try {
            await storageService.deleteGame(id);
            
            set(state => ({
              games: state.games.filter(game => game.id !== id),
              error: null
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '删除游戏失败'
            });
          }
        },

        // 清除搜索结果
        clearSearch: () => {
          set({ searchResults: null, searchLoading: false });
        },

        // 清除错误
        clearError: () => {
          set({ error: null });
        },

        // 加载已保存的游戏
        loadSavedGames: async () => {
          set({ loading: true, error: null });
          
          try {
            const savedGames = await storageService.getAllGames();
            set({ games: savedGames, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '加载游戏列表失败',
              loading: false 
            });
          }
        },
      }),
      {
        name: 'game-store',
        partialize: (state) => ({
          games: state.games,
          popularGames: state.popularGames,
        }),
      }
    ),
    {
      name: 'game-store',
    }
  )
); 