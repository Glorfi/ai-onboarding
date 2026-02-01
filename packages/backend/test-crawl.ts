import { chromium } from 'playwright';

async function testCrawl() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://trustgather.com/';

  console.log('Navigating to:', url);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('Waiting for networkidle...');
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    console.log('networkidle timeout (ok)');
  }

  console.log('Waiting for DOM stable...');
  await page.waitForTimeout(3000);

  // Extract all links
  const result = await page.evaluate(() => {
    const doc = document;
    const linkElements = doc.querySelectorAll('a[href]');
    const links: { href: string; text: string }[] = [];

    linkElements.forEach((link: Element) => {
      const href = link.getAttribute('href');
      const text = (link as HTMLElement).innerText?.trim().slice(0, 50);
      if (href) {
        links.push({ href, text: text || '(no text)' });
      }
    });

    return {
      title: doc.title,
      bodyLength: doc.body?.innerText?.length || 0,
      linksCount: links.length,
      links
    };
  });

  console.log('\n=== Results ===');
  console.log('Title:', result.title);
  console.log('Body text length:', result.bodyLength);
  console.log('Total links found:', result.linksCount);
  console.log('\nAll links:');

  for (const link of result.links) {
    console.log(`  ${link.href} - "${link.text}"`);
  }

  // Now filter same domain
  const baseDomain = new URL(url).hostname;
  console.log('\nBase domain:', baseDomain);

  const sameDomainLinks = result.links.filter(l => {
    try {
      const resolved = new URL(l.href, url);
      const matches = resolved.hostname === baseDomain;
      if (!matches) {
        console.log(`  Filtered out: ${l.href} -> ${resolved.hostname}`);
      }
      return matches;
    } catch {
      return false;
    }
  });

  console.log('\nSame domain links:', sameDomainLinks.length);
  for (const link of sameDomainLinks) {
    const resolved = new URL(link.href, url).href;
    console.log(`  ${resolved}`);
  }

  await browser.close();
}

testCrawl().catch(console.error);
