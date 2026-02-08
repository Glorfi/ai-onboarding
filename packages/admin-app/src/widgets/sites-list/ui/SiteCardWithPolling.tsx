import ApiKeyBlocks from '@/entities/api-key/ui/ApiKey';
import {
  CrawlProgress,
  SiteCard,
  useGetCrawlStatusQuery,
  useGetMySitesQuery,
} from '@/entities/site';
import { DeleteSiteDialog } from '@/features/site/delete';
import { RecrawlButton } from '@/features/site/recrawl';
import { Button } from '@/shared/ui';
import type {
  ISiteDTO,
  ISiteWithApiKeyDTO,
  SiteStatus,
} from '@ai-onboarding/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SiteCardWithPollingProps {
  site: ISiteWithApiKeyDTO;
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
          {/* <Button variant="ghost" size={'icon-sm'}>
            <Plus />
          </Button> */}
          {isActive && <RecrawlButton siteId={site.id} disabled={isCrawling} />}
          <DeleteSiteDialog
            siteId={site.id}
            siteName={site.name || site.domain}
            trigger={
              <Button variant="ghost" size={'icon-sm'}>
                <Trash2 />
              </Button>
            }
          />
        </div>
      }
    />
  );
}
