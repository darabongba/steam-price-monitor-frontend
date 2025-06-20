import { useState, useEffect, useCallback, useRef } from 'react';
import { GameSearchResult } from '@/types/game';
import { steamService } from '@/services/steamService';
import { useDebounce } from './useDebounce';

interface UseGameSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  autoSearch?: boolean;
}

interface UseGameSearchReturn {
  query: string;
  results: GameSearchResult | null;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  search: (searchQuery: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  setQuery: (query: string) => void;
}

export function useGameSearch(options: UseGameSearchOptions = {}): UseGameSearchReturn {
  const {
    debounceMs = 500,
    minQueryLength = 2,
    autoSearch = true,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 执行搜索
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < minQueryLength) {
      setResults(null);
      setHasSearched(false);
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const searchResults = await steamService.searchGames(searchQuery);
      
      // 检查请求是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setResults(searchResults);
      setHasSearched(true);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setError(err instanceof Error ? err.message : '搜索失败');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [minQueryLength]);

  // 自动搜索（当启用时）
  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search, autoSearch]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 清除搜索结果
  const clearResults = useCallback(() => {
    setResults(null);
    setHasSearched(false);
    setError(null);
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    hasSearched,
    search,
    clearResults,
    clearError,
    setQuery,
  };
} 