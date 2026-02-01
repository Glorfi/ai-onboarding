import type { ISite } from '@ai-onboarding/shared';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/shared/ui';
import { SiteStatusBadge } from './SiteStatusBadge';
import { formatDomain, formatDate } from '../lib';

interface SiteCardProps {
  site: ISite;
  actionsSlot?: React.ReactNode;
  progressSlot?: React.ReactNode;
}

export function SiteCard(props: SiteCardProps) {
  const { site, actionsSlot, progressSlot } = props;
  return (
    <Card
      className="    flex flex-col
    basis-full
    md:basis-[calc(50%-0.5rem)]
    lg:basis-[calc(33.333%-0.75rem)]
    min-w-[320px]
    max-w-full
    shrink-0"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {site.name || formatDomain(site.url)}
          <SiteStatusBadge status={site.status} />
        </CardTitle>
        <CardDescription>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {site.url}
          </a>
        </CardDescription>
        {actionsSlot && <CardAction>{actionsSlot}</CardAction>}
      </CardHeader>

      <CardContent>
        {progressSlot}

        <div className="text-sm text-muted-foreground space-y-1 mt-2">
          <p>Domain: {site.domain}</p>
          <p>Last crawled: {formatDate(site.lastCrawledAt)}</p>
          {site.additionalUrls.length > 0 && (
            <p>Additional URLs: {site.additionalUrls.length}</p>
          )}
        </div>

        {site.errorMessage && (
          <p className="text-sm text-destructive mt-2">
            Error: {site.errorMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
