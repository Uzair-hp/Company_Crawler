import { NextRequest } from "next/server";
import { searchCompanyWebsite, searchCompetitors, querySerper } from "src/lib/serper";
import { crawlWebsite } from "src/lib/crawler";
import { analyzeCompanyData } from "src/lib/openrouter";

// Mark this route as dynamic to ensure runtime evaluation
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, url, serperKey, openrouterKey, model, customFocus } = body;

    if (!name && !url) {
      return Response.json(
        { error: "Please provide either a company name or a website URL." },
        { status: 400 }
      );
    }

    let targetUrl = url ? url.trim() : "";
    let companyName = name ? name.trim() : "";

    // 1. Resolve company name/URL using Serper if necessary
    let resolvedWebsiteInfo = null;
    if (!targetUrl && companyName) {
      try {
        console.log(`Resolving website URL for: ${companyName}`);
        resolvedWebsiteInfo = await searchCompanyWebsite(companyName, serperKey);
        targetUrl = resolvedWebsiteInfo.url;
        if (!companyName && resolvedWebsiteInfo.name) {
          companyName = resolvedWebsiteInfo.name;
        }
      } catch (err: any) {
        console.error("Failed to resolve website from company name:", err);
        return Response.json(
          { error: `Could not automatically find a website for "${companyName}". Please enter the URL directly.` },
          { status: 422 }
        );
      }
    }

    // Ensure target URL has a valid protocol
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    // If company name was not provided but URL was, extract domain as temporary name
    if (!companyName && targetUrl) {
      try {
        const domain = new URL(targetUrl).hostname.replace("www.", "");
        companyName = domain.split(".")[0];
        // Capitalize first letter
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      } catch {
        companyName = "Target Company";
      }
    }

    console.log(`Target URL resolved to: ${targetUrl}`);
    console.log(`Target Company Name resolved to: ${companyName}`);

    // 2. Perform Serper Searches for additional context
    let searchContext: any = {};
    try {
      console.log(`Fetching competitor details for: ${companyName}`);
      const competitors = await searchCompetitors(companyName, serperKey);
      
      console.log(`Fetching contact details for: ${companyName}`);
      const contactInfoSearch = await querySerper(`${companyName} address phone number email contact`, serperKey);

      searchContext = {
        competitors,
        contactInfoSearch: contactInfoSearch.organic.slice(0, 3),
        knowledgeGraph: contactInfoSearch.knowledgeGraph,
      };
    } catch (err: any) {
      console.warn("Serper search failed. Proceeding with crawl data only:", err.message || err);
      searchContext = { error: "Serper context retrieval failed" };
    }

    // 3. Crawl target website
    let crawledPages: any[] = [];
    if (targetUrl) {
      try {
        console.log(`Crawling website: ${targetUrl}`);
        crawledPages = await crawlWebsite(targetUrl, 5); // Crawl up to 5 key pages
      } catch (err: any) {
        console.error("Web crawling failed:", err.message || err);
        // We continue with empty crawl data; LLM can analyze searchContext if available
      }
    }

    if (crawledPages.length === 0 && (!searchContext || searchContext.error)) {
      return Response.json(
        { error: "Failed to gather any data from both website crawling and search queries. Please verify the input and API keys." },
        { status: 500 }
      );
    }

    // 4. Run OpenRouter AI analysis
    console.log(`Analyzing company profile using model: ${model || "google/gemini-2.5-flash"}`);
    const analysisReport = await analyzeCompanyData(
      companyName,
      targetUrl,
      crawledPages,
      searchContext,
      model,
      openrouterKey,
      customFocus
    );

    return Response.json({
      success: true,
      data: analysisReport,
      crawledCount: crawledPages.length,
      pages: crawledPages.map((p) => ({ url: p.url, title: p.title })),
    });
  } catch (error: any) {
    console.error("API Error in /api/research:", error);
    return Response.json(
      { error: error.message || "An unexpected error occurred during research generation." },
      { status: 500 }
    );
  }
}
