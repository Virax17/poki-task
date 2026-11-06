// App-wide constants (DEVELOPER_GUIDE.md §6)

// API endpoints
// The brief's beta.pokeapi.co/graphql/v1beta endpoint is currently unreachable; this is the maintained successor
// (same data, tables without the `pokemon_v2_` prefix).
export const POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';
export const MOCK_GRAPHQL_URL = 'http://localhost:4000';

// Resilience
export const API_RETRY_COUNT = 3;
export const API_RETRY_DELAY_MS = 1000;

// Input debouncing
export const SEARCH_DEBOUNCE_MS = 300;

// Pagination
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

// Toasts
export const TOAST_DURATION_MS = 4000;
