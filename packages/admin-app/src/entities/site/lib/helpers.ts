export function formatDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function calculateCrawlProgress(
  pagesCrawled: number,
  pagesDiscovered: number
): number {
  if (pagesDiscovered === 0) return 0;
  return Math.round((pagesCrawled / pagesDiscovered) * 100);
}
