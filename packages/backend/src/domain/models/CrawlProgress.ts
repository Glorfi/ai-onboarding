export interface ICrawlError {
  url: string;
  message: string;
}

export interface ICrawlProgress {
  pagesDiscovered: number;
  pagesCrawled: number;
  pagesProcessed: number;
  currentUrl?: string;
  errors: ICrawlError[];
}
