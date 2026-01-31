import { injectable } from 'tsyringe';
import { chromium, type Browser, type Page } from 'playwright';
import { DEFAULTS } from '@ai-onboarding/shared';
import type {
  ICrawlerService,
  ICrawlResult,
} from '../../domain/services/crawling';

@injectable()
export class PlaywrightCrawlerService implements ICrawlerService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
      });
    }
    return this.browser;
  }

  async crawlPage(
    url: string,
    timeout: number = DEFAULTS.PAGE_TIMEOUT_MS,
  ): Promise<ICrawlResult> {
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (compatible; OnboardingBot/1.0; +https://onboarding.ai)',
      });

      await page.goto(url, {
        waitUntil: 'load',
        timeout,
      });

      // Wait a bit for any dynamic content to load
      await page.waitForTimeout(2000);

      // Extract content and links
      const result = await page.evaluate(
        (): {
          title: string;
          content: string;
          links: string[];
        } => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc = (globalThis as any).document;

          // Remove unwanted elements
          const selectorsToRemove = [
            'nav',
            'footer',
            'header',
            'script',
            'style',
            'noscript',
            'iframe',
            '[role="navigation"]',
            '[role="banner"]',
            '[role="contentinfo"]',
            '.cookie-banner',
            '.cookie-consent',
            '#cookie-banner',
            '.advertisement',
            '.ad-container',
          ];

          selectorsToRemove.forEach((selector: string) => {
            doc.querySelectorAll(selector).forEach((el: any) => el.remove());
          });

          // Remove hidden elements
          doc
            .querySelectorAll('[style*="display: none"]')
            .forEach((el: any) => el.remove());
          doc
            .querySelectorAll('[style*="visibility: hidden"]')
            .forEach((el: any) => el.remove());
          doc.querySelectorAll('[hidden]').forEach((el: any) => el.remove());

          // Get title
          const title = doc.title || '';

          // Get main content text
          const content = doc.body?.innerText || '';

          // Get all links
          const linkElements = doc.querySelectorAll('a[href]');
          const links: string[] = [];
          linkElements.forEach((link: any) => {
            const href = link.getAttribute('href');
            if (href) {
              links.push(href);
            }
          });

          return { title, content, links };
        },
      );

      // Resolve relative URLs to absolute
      const resolvedLinks = result.links
        .map((link) => {
          try {
            return new URL(link, url).href;
          } catch {
            return null;
          }
        })
        .filter((link): link is string => link !== null);

      return {
        url,
        title: result.title,
        content: result.content.trim(),
        links: resolvedLinks,
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Check for bot detection patterns
      if (
        message.includes('403') ||
        message.includes('Access Denied') ||
        message.includes('Cloudflare')
      ) {
        return {
          url,
          title: '',
          content: '',
          links: [],
          success: false,
          error: 'Bot detection - access denied',
        };
      }

      return {
        url,
        title: '',
        content: '',
        links: [],
        success: false,
        error: message,
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  extractSameDomainLinks(links: string[], baseUrl: string): string[] {
    const baseDomain = new URL(baseUrl).hostname;

    return links.filter((link) => {
      try {
        const linkDomain = new URL(link).hostname;
        return linkDomain === baseDomain;
      } catch {
        return false;
      }
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
