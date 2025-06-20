export interface Game {
  id: string;
  steamId: string;
  name: string;
  imageUrl: string;
  headerImage?: string;
  description: string;
  shortDescription?: string;
  developer: string;
  publisher: string;
  tags: string[];
  categories: string[];
  genres: string[];
  releaseDate: string;
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  price?: {
    current: number;
    original: number;
    discount: number;
    currency: string;
    formatted: string;
    isFree: boolean;
  };
  rating?: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface GamePrice {
  steamId: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  currency: string;
  formatted: string;
  isFree: boolean;
  onSale: boolean;
  saleEndDate?: Date;
  lastUpdated: Date;
}

export interface GameSearchResult {
  games: Game[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface GameDetails extends Game {
  screenshots: string[];
  movies: string[];
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
  dlc: string[];
  achievements: number;
  metacriticScore?: number;
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
  recordedAt: Date;
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