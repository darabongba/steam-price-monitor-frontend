export interface Game {
  steamId: string;
  name: string;
  type: string;
  description: string;
  fullDescription: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  comingSoon: boolean;
  headerImage: string;
  screenshots: string[];
  movies: string[];
  genres: string[];
  categories: string[];
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  price: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    formatted: string;
  };
  isFree: boolean;
  dlc: number[];
  achievements: number;
  metacriticScore?: number;
  recommendations: number;
  lastUpdated: string;
}

export interface LocalGame extends Game {
  id: string;
  createdAt: string;
}

export interface GamePrice {
  steamId: string;
  currency: string;
  initial: number;
  final: number;
  discount_percent: number;
  formatted: string;
  isFree: boolean;
  onSale: boolean;
  saleEndDate?: string;
  lastUpdated: string;
}

export interface GameSearchResult {
  games: Game[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface GameDetails extends Game {
  systemRequirements: {
    minimum?: string;
    recommended?: string;
  };
  reviews: {
    positive: number;
    negative: number;
    total: number;
    score: number;
  };
  steamRating: number;
  ageRating: string;
}

export interface SteamSearchResponse {
  response: {
    apps: Array<{
      appid: number;
      name: string;
    }>;
  };
}

export interface PriceHistory {
  id: string;
  gameId: string;
  steamId: string;
  price: number;
  originalPrice: number;
  discount: number;
  currency: string;
  recordedAt: string;
  source: 'steam' | 'manual' | 'api';
}

export interface SteamAppDetails {
  success: boolean;
  data: {
    steam_appid: number;
    name: string;
    type: string;
    required_age: number;
    is_free: boolean;
    detailed_description: string;
    short_description: string;
    supported_languages: string;
    header_image: string;
    website: string;
    developers: string[];
    publishers: string[];
    platforms: {
      windows: boolean;
      mac: boolean;
      linux: boolean;
    };
    categories: Array<{
      id: number;
      description: string;
    }>;
    genres: Array<{
      id: number;
      description: string;
    }>;
    screenshots: Array<{
      id: number;
      path_thumbnail: string;
      path_full: string;
    }>;
    movies?: Array<{
      id: number;
      name: string;
      thumbnail: string;
      webm: {
        480: string;
        max: string;
      };
    }>;
    release_date: {
      coming_soon: boolean;
      date: string;
    };
    price_overview?: {
      currency: string;
      initial: number;
      final: number;
      discount_percent: number;
      initial_formatted: string;
      final_formatted: string;
    };
  };
}