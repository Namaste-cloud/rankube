const COUNTRIES = [
  { code: 'KR', name: 'South Korea', nameKo: '한국', flag: '🇰🇷' },
  { code: 'US', name: 'United States', nameKo: '미국/글로벌', flag: '🇺🇸' },
  { code: 'JP', name: 'Japan', nameKo: '일본', flag: '🇯🇵' },
  { code: 'GB', name: 'United Kingdom', nameKo: '영국', flag: '🇬🇧' },
  { code: 'BR', name: 'Brazil', nameKo: '브라질', flag: '🇧🇷' },
  { code: 'IN', name: 'India', nameKo: '인도', flag: '🇮🇳' },
  { code: 'FR', name: 'France', nameKo: '프랑스', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', nameKo: '독일', flag: '🇩🇪' },
  { code: 'CA', name: 'Canada', nameKo: '캐나다', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', nameKo: '호주', flag: '🇦🇺' },
];

const CATEGORIES = [
  { id: 'Default', label: 'Default' },
  { id: 'Music', label: 'Music' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Movies', label: 'Movies' },
  { id: 'News', label: 'News' },
];

const LIMITS = [10, 20, 50];

const CACHE_TTL = {
  FRESH: 5 * 60 * 1000,      // 5 minutes
  STALE: 25 * 60 * 1000,     // 25 minutes
  MAX: 30 * 60 * 1000,       // 30 minutes
  INSTANCES: 60 * 60 * 1000, // 1 hour
};

const TIMEOUTS = {
  INVIDIOUS: 5000,
  PIPED: 5000,
  YOUTUBE: 10000,
  HEALTH_CHECK: 3000,
};

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://watchapi.whatever.social',
];

const INVIDIOUS_INSTANCES_URL = 'https://api.invidious.io/instances.json';

module.exports = {
  COUNTRIES,
  CATEGORIES,
  LIMITS,
  CACHE_TTL,
  TIMEOUTS,
  PIPED_INSTANCES,
  INVIDIOUS_INSTANCES_URL,
};
