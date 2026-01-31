export interface ICrawlResult {
  url: string;
  content: string;
  title: string;
  links: string[];
  success: boolean;
  error?: string;
}

export interface ICrawlerService {
  crawlPage(url: string, timeout?: number): Promise<ICrawlResult>;
  extractSameDomainLinks(links: string[], baseUrl: string): string[];
}
