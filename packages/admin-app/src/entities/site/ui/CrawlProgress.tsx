import type { ICrawlProgress } from '@ai-onboarding/shared';
import { Progress } from '@/shared/ui';
import { calculateCrawlProgress } from '../lib';

interface CrawlProgressProps {
  progress: ICrawlProgress;
}

export function CrawlProgress({ progress }: CrawlProgressProps) {
  const { pagesDiscovered, pagesCrawled, currentUrl, errors } = progress;
  const percentage = calculateCrawlProgress(pagesCrawled, pagesDiscovered);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Crawled: {pagesCrawled} / {pagesDiscovered}
        </span>
        <span>{percentage}%</span>
      </div>
      <Progress value={percentage} />
      {currentUrl && (
        <p className="text-xs text-muted-foreground truncate">
          Current: {currentUrl}
        </p>
      )}
      {errors.length > 0 && (
        <p className="text-xs text-destructive">{errors.length} error(s)</p>
      )}
    </div>
  );
}
