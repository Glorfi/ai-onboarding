import type { SiteStatus } from '@ai-onboarding/shared';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface SiteStatusConfig {
  label: string;
  variant: BadgeVariant;
}

export const SITE_STATUS_CONFIG: Record<SiteStatus, SiteStatusConfig> = {
  pending: { label: 'Pending', variant: 'secondary' },
  crawling: { label: 'Crawling...', variant: 'default' },
  active: { label: 'Active', variant: 'outline' },
  error: { label: 'Error', variant: 'destructive' },
};
