export const SITE_STATUS = {
  PENDING: 'pending',
  CRAWLING: 'crawling',
  ACTIVE: 'active',
  ERROR: 'error',
} as const;

export const TOOLTIP_POSITION = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

export const ANALYTICS_EVENT_TYPE = {
  WALKTHROUGH_STARTED: 'walkthrough_started',
  WALKTHROUGH_COMPLETED: 'walkthrough_completed',
  WALKTHROUGH_SKIPPED: 'walkthrough_skipped',
  CHAT_MESSAGE: 'chat_message',
} as const;

export const DEFAULTS = {
  TRIGGER_DELAY_SECONDS: 5,
  WALKTHROUGH_STEPS_COUNT: 5,
  MAX_CRAWL_PAGES: 50,
  CRAWL_DEPTH: 2,
  PAGE_TIMEOUT_MS: 30000,
  CHUNK_SIZE_TOKENS: 500,
  CHUNK_OVERLAP_TOKENS: 50,
} as const;

export const PASSWORD_MIN_LENGTH = 4;
