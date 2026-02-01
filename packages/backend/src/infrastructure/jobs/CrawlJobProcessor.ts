import { injectable, inject } from 'tsyringe';
import { v4 as uuid } from 'uuid';
import { DEFAULTS, type ICrawlProgress } from '@ai-onboarding/shared';
import type {
  ISiteRepository,
  IKnowledgeBaseRepository,
} from '@/domain/repositories';
import type { ICrawlerService, ITextChunker } from '@/domain/services/crawling';
import type { IEmbeddingService } from '@/domain/services/embedding';
import type { IVectorStoreService, IVector } from '@/domain/services/vector';
import type { ICrawlStatusService } from '@/domain/services/cache';
import type { ICrawlJobData } from './queue';

interface ICrawlError {
  url: string;
  message: string;
}

interface ICrawledPage {
  url: string;
  title: string;
  content: string;
}

@injectable()
export class CrawlJobProcessor {
  constructor(
    @inject('ISiteRepository') private siteRepo: ISiteRepository,
    @inject('IKnowledgeBaseRepository')
    private kbRepo: IKnowledgeBaseRepository,
    @inject('ICrawlerService') private crawler: ICrawlerService,
    @inject('ITextChunker') private chunker: ITextChunker,
    @inject('IEmbeddingService') private embedding: IEmbeddingService,
    @inject('IVectorStoreService') private vectorStore: IVectorStoreService,
    @inject('ICrawlStatusService') private statusService: ICrawlStatusService,
  ) {}

  async process(data: ICrawlJobData): Promise<void> {
    const { siteId, urls } = data;
    const visited = new Set<string>();
    const discovered = new Set<string>(); // Track all discovered URLs
    const queue: { url: string; depth: number }[] = urls.map((u) => {
      const normalized = this.normalizeUrl(u);
      discovered.add(normalized);
      return { url: normalized, depth: 0 };
    });
    const crawledPages: ICrawledPage[] = [];
    const errors: ICrawlError[] = [];
    const startTime = Date.now();

    console.log(`[Crawl ${siteId}] Starting crawl for ${urls.length} URLs`);

    // Update status to crawling
    await this.siteRepo.updateStatus(siteId, 'crawling');

    try {
      // BFS crawling
      while (queue.length > 0 && visited.size < DEFAULTS.MAX_CRAWL_PAGES) {
        // Check total timeout
        if (Date.now() - startTime > DEFAULTS.TOTAL_CRAWL_TIMEOUT_MS) {
          console.log(`[Crawl ${siteId}] Total timeout reached`);
          break;
        }

        const item = queue.shift()!;
        const { url, depth } = item;

        // Skip if already visited or too deep
        if (visited.has(url) || depth > DEFAULTS.CRAWL_DEPTH) {
          continue;
        }

        visited.add(url);

        console.log(`[Crawl ${siteId}] Crawling: ${url} (depth: ${depth})`);

        // Crawl the page
        const result = await this.crawler.crawlPage(
          url,
          DEFAULTS.PAGE_TIMEOUT_MS,
        );

        if (result.success && result.content.trim().length > 0) {
          crawledPages.push({
            url: result.url,
            title: result.title,
            content: result.content,
          });

          // Add discovered links to queue (only if not at max depth)
          if (depth < DEFAULTS.CRAWL_DEPTH) {
            const sameDomainLinks = this.crawler.extractSameDomainLinks(
              result.links,
              url,
            );
            console.log('RAW LINKS:', result.links);
            console.log('SAME DOMAIN:', sameDomainLinks);

            for (const link of sameDomainLinks) {
              const normalizedLink = this.normalizeUrl(link);
              if (!discovered.has(normalizedLink)) {
                discovered.add(normalizedLink);
                queue.push({ url: normalizedLink, depth: depth + 1 });
              }
            }
          }
        } else {
          console.log(
            `[Crawl ${siteId}] Failed to crawl: ${url} - ${result.error}`,
          );
          errors.push({ url, message: result.error || 'Unknown error' });
        }

        // Update progress after crawling and discovering new links
        await this.updateProgress(siteId, {
          pagesDiscovered: discovered.size,
          pagesCrawled: visited.size,
          pagesProcessed: crawledPages.length,
          currentUrl: url,
          errors,
        });

        // Small delay between requests to be respectful
        await this.delay(1000);
      }

      console.log(
        `[Crawl ${siteId}] Crawling complete. Pages: ${crawledPages.length}, Errors: ${errors.length}`,
      );

      // Check minimum pages requirement
      if (crawledPages.length < DEFAULTS.MIN_PAGES_FOR_SUCCESS) {
        throw new Error(
          `Insufficient pages: ${crawledPages.length}/${DEFAULTS.MIN_PAGES_FOR_SUCCESS}`,
        );
      }

      // Process content: chunk, embed, store
      await this.processContent(siteId, crawledPages);

      // Update final status
      await this.siteRepo.updateStatus(siteId, 'active');

      await this.updateProgress(siteId, {
        pagesDiscovered: discovered.size,
        pagesCrawled: visited.size,
        pagesProcessed: crawledPages.length,
        errors,
      });

      console.log(`[Crawl ${siteId}] Successfully completed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Crawl ${siteId}] Failed:`, message);

      await this.siteRepo.updateStatus(siteId, 'error', message);

      await this.updateProgress(siteId, {
        pagesDiscovered: discovered.size,
        pagesCrawled: visited.size,
        pagesProcessed: crawledPages.length,
        errors: [...errors, { url: 'crawl', message }],
      });

      throw error;
    }
  }

  private async processContent(
    siteId: string,
    pages: ICrawledPage[],
  ): Promise<void> {
    console.log(`[Crawl ${siteId}] Processing ${pages.length} pages`);

    const allChunks: { content: string; pageUrl: string; index: number }[] = [];

    // Chunk all pages
    for (const page of pages) {
      const chunks = this.chunker.chunk(page.content);

      for (const chunk of chunks) {
        allChunks.push({
          content: chunk.content,
          pageUrl: page.url,
          index: chunk.index,
        });
      }
    }

    console.log(`[Crawl ${siteId}] Generated ${allChunks.length} chunks`);

    if (allChunks.length === 0) {
      return;
    }

    // Generate embeddings
    const texts = allChunks.map((c) => c.content);

    const embeddings = await this.embedding.generateEmbeddings(texts);

    console.log(`[Crawl ${siteId}] Generated ${embeddings.length} embeddings`);

    // Prepare vectors and KB records
    const vectors: IVector[] = [];
    const kbRecords: {
      siteId: string;
      pageUrl: string;
      content: string;
      vectorId: string;
    }[] = [];

    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const vectorId = `${siteId}-${uuid()}`;

      vectors.push({
        id: vectorId,
        values: embeddings[i],
        metadata: {
          siteId,
          pageUrl: chunk.pageUrl,
          content: chunk.content,
        },
      });

      kbRecords.push({
        siteId,
        pageUrl: chunk.pageUrl,
        content: chunk.content,
        vectorId,
      });
    }

    // Store in Pinecone
    await this.vectorStore.upsert(vectors);
    console.log(
      `[Crawl ${siteId}] Stored ${vectors.length} vectors in Pinecone`,
    );

    // Store in PostgreSQL
    await this.kbRepo.createMany(kbRecords);
    console.log(`[Crawl ${siteId}] Stored ${kbRecords.length} KB records`);
  }

  private async updateProgress(
    siteId: string,
    progress: ICrawlProgress,
  ): Promise<void> {
    try {
      await this.statusService.setProgress(siteId, progress);
    } catch (error) {
      console.error(`[Crawl ${siteId}] Failed to update progress:`, error);
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, fragment, and normalize
      parsed.hash = '';
      let normalized = parsed.href;
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
