import { CrawlProgress, SiteCard, useGetCrawlStatusQuery, useGetMySitesQuery } from '@/entities/site';
import { DeleteSiteDialog } from '@/features/site/delete';
import { RecrawlButton } from '@/features/site/recrawl';
import { Button } from '@/shared/ui';
import type { ISite, SiteStatus } from '@ai-onboarding/shared';
import { useEffect, useState } from 'react';

interface SiteCardWithPollingProps {
  site: ISite;
}

export default function SiteCardWithPolling(props: SiteCardWithPollingProps) {
  const { site } = props;
  const [status, setStatus] = useState<SiteStatus>(site.status);
  const [shouldPoll, setShouldPoll] = useState<boolean>(
    site.status === 'crawling',
  );

  const { data: crawlStatus } = useGetCrawlStatusQuery(site.id, {
    pollingInterval: shouldPoll ? 3000 : 0,
    skip: !shouldPoll,
  });
  const { refetch } = useGetMySitesQuery();

  const isCrawling = status === 'crawling';
  const isActive = status === 'active';

  useEffect(() => {
    if (crawlStatus) {
      setStatus(crawlStatus.status);
      crawlStatus.status === 'crawling'
        ? setShouldPoll(true)
        : setShouldPoll(false);
      crawlStatus.status === 'active' && refetch();
    }
  }, [crawlStatus]);

  useEffect(() => {
    site.status === 'crawling' ? setShouldPoll(true) : setShouldPoll(false);
  }, [site]);

  return (
    <SiteCard
      site={site}
      progressSlot={
        isCrawling && crawlStatus?.progress ? (
          <CrawlProgress progress={crawlStatus.progress} />
        ) : null
      }
      actionsSlot={
        <div className="flex gap-2">
          {isActive && <RecrawlButton siteId={site.id} disabled={isCrawling} />}
          <DeleteSiteDialog
            siteId={site.id}
            siteName={site.name || site.domain}
            trigger={
              <Button variant="ghost" size="sm">
                Delete
              </Button>
            }
          />
        </div>
      }
    />
  );
}
