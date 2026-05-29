/* =============================================
   Rankube — Constants (ES Module)
   ============================================= */

export const COUNTRIES = [
  { code: 'KR', name: 'South Korea', nameKo: '한국', flag: '🇰🇷' },
  { code: 'US', name: 'United States', nameKo: '미국', flag: '🇺🇸' },
  { code: 'JP', name: 'Japan', nameKo: '일본', flag: '🇯🇵' },
  { code: 'GB', name: 'United Kingdom', nameKo: '영국', flag: '🇬🇧' },
  { code: 'BR', name: 'Brazil', nameKo: '브라질', flag: '🇧🇷' },
  { code: 'IN', name: 'India', nameKo: '인도', flag: '🇮🇳' },
  { code: 'FR', name: 'France', nameKo: '프랑스', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', nameKo: '독일', flag: '🇩🇪' },
  { code: 'CA', name: 'Canada', nameKo: '캐나다', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', nameKo: '호주', flag: '🇦🇺' },
];

export const CATEGORIES = [
  { id: 'Default', label: 'Trending', labelKo: '인기 급상승', icon: '🔥' },
  { id: 'Music', label: 'Music', labelKo: '음악', icon: '🎵' },
  { id: 'Gaming', label: 'Gaming', labelKo: '게임', icon: '🎮' },
  { id: 'Movies', label: 'Movies', labelKo: '영화', icon: '🎬' },
  { id: 'News', label: 'News', labelKo: '뉴스', icon: '📰' },
];

export const LIMITS = [10, 20, 50];

export const API_BASE = '';

export const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const DEFAULT_STATE = {
  region: 'KR',
  type: 'Default',
  limit: 20,
  autoRefresh: true,
};
