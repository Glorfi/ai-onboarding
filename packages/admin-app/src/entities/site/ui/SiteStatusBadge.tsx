import type { SiteStatus } from '@ai-onboarding/shared';
import { Badge } from '@/shared/ui';
import { SITE_STATUS_CONFIG } from '../config';

interface SiteStatusBadgeProps {
  status: SiteStatus;
}

export function SiteStatusBadge({ status }: SiteStatusBadgeProps) {
  const config = SITE_STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant}>
      {status === 'crawling' && <span className="mr-1 animate-pulse">●</span>}
      {config.label}
    </Badge>
  );
}
