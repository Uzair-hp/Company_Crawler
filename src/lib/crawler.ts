import * as cheerio from "cheerio";

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

/**
 * Normalizes a URL by stripping hashes and trailing slashes,
 * and converts relative paths to absolute URLs.
 */
function normalizeUrl(urlStr: string, baseUrl: string): string | null {
  try {
    const url = new URL(urlStr, baseUrl);
    // Only crawl http and https protocols
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    // Remove hash/fragment
    url.hash = "";
    // Remove UTM and other common tracking query parameters
    const paramsToClean = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"];
    paramsToClean.forEach((p) => url.searchParams.delete(p));

    let normalized = url.toString();
    // Strip trailing slash for consistency (unless it's just the root domain)
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Crawls a website recursively up to a limit of pages, extracting clean text content
 */
export async function crawlWebsite(startUrl: string, maxPages: number = 6): Promise<CrawledPage[]> {
  const crawled: CrawledPage[] = [];
  const visited = new Set<string>();
  const toVisit: string[] = [];

  let startUrlObj: URL;
  try {
    startUrlObj = new URL(startUrl);
  } catch {
    // If it doesn't start with protocol, try adding https
    try {
      startUrlObj = new URL(`https://${startUrl}`);
    } catch {
      throw new Error(`Invalid starting URL: ${startUrl}`);
    }
  }

  const baseOrigin = startUrlObj.origin;
  const baseHostname = startUrlObj.hostname.replace("www.", "");
  const normalizedStart = normalizeUrl(startUrlObj.toString(), startUrlObj.toString());

  if (normalizedStart) {
    toVisit.push(normalizedStart);
  }

  while (toVisit.length > 0 && crawled.length < maxPages) {
    const currentUrl = toVisit.shift()!;

    if (visited.has(currentUrl)) {
      continue;
    }
    visited.add(currentUrl);

    try {
      console.log(`Crawling: ${currentUrl}`);
      const response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout per page
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${currentUrl}: Status ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.warn(`Skipping non-HTML page ${currentUrl} (${contentType})`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract title
      const title = $("title").text().trim() || $("h1").first().text().trim() || "Untitled Page";

      // Link Discovery
      const linksOnPage: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
          const absolute = normalizeUrl(href, currentUrl);
          if (absolute) {
            const absoluteUrlObj = new URL(absolute);
            const absoluteHostname = absoluteUrlObj.hostname.replace("www.", "");

            // Stay on the same domain
            if (absoluteHostname === baseHostname || absoluteHostname.endsWith(`.${baseHostname}`)) {
              // Ignore typical binary/asset files
              if (!absoluteUrlObj.pathname.match(/\.(pdf|zip|tar|gz|exe|dmg|mp4|mp3|png|jpg|jpeg|gif|css|js|xml|json)$/i)) {
                // Ignore auth / signup / signout / dashboard sections
                if (!absoluteUrlObj.pathname.match(/\/(login|signup|signin|signout|register|auth|logout|dashboard|cart|checkout|admin)\b/i)) {
                  linksOnPage.push(absolute);
                }
              }
            }
          }
        }
      });

      // Clean HTML to extract text content
      // Remove boilerplate, navigation, footer, forms, styling, scripts
      const $clean = cheerio.load(html);
      $clean("script, style, iframe, noscript, nav, footer, header, svg, form, select, option, button, [role='banner'], [role='navigation'], [role='contentinfo']").remove();

      // Extract text content from remaining blocks
      // Prioritize main content wrappers if they exist
      const selectors = ["main", "article", "#content", ".content", "body"];
      let pageText = "";
      for (const selector of selectors) {
        const element = $clean(selector);
        if (element.length > 0) {
          pageText = element.text();
          break;
        }
      }

      if (!pageText) {
        pageText = $clean.text();
      }

      // Clean whitespace
      pageText = pageText
        .replace(/\s+/g, " ")
        .replace(/\n+/g, " ")
        .trim();

      // Limit length of text per page to prevent hitting token limits (max 8000 chars per page)
      if (pageText.length > 8000) {
        pageText = pageText.substring(0, 8000) + "... [truncated]";
      }

      crawled.push({
        url: currentUrl,
        title,
        text: pageText,
      });

      // Queue discovered links
      for (const link of linksOnPage) {
        if (!visited.has(link) && !toVisit.includes(link)) {
          // Prioritize key pages by pushing them to the front of the queue
          const isPriority = link.toLowerCase().match(/\/(about|product|service|pricing|feature|solution|contact|company)\b/i);
          if (isPriority) {
            toVisit.unshift(link);
          } else {
            toVisit.push(link);
          }
        }
      }
    } catch (err: any) {
      console.error(`Error crawling ${currentUrl}:`, err.message || err);
    }
  }

  return crawled;
}
