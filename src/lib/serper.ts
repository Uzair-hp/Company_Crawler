export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

export interface SerperSearchResponse {
  organic: SerperResult[];
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
}

/**
 * Perform a search using Serper.dev
 */
export async function querySerper(query: string, customApiKey?: string): Promise<SerperSearchResponse> {
  const apiKey = customApiKey || process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("Serper.dev API key is missing. Please configure it in your environment or settings.");
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Serper API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      organic: (data.organic || []).map((item: any) => ({
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
      })),
      knowledgeGraph: data.knowledgeGraph
        ? {
            title: data.knowledgeGraph.title,
            type: data.knowledgeGraph.type,
            description: data.knowledgeGraph.description,
            attributes: data.knowledgeGraph.attributes,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error("Error in querySerper:", error);
    throw error;
  }
}

/**
 * Searches for the official company website
 */
export async function searchCompanyWebsite(companyName: string, apiKey?: string): Promise<{ url: string; snippet: string; name: string }> {
  const query = `${companyName} official website`;
  const result = await querySerper(query, apiKey);

  if (result.organic.length > 0) {
    // Return first organic result
    const first = result.organic[0];
    return {
      url: first.link,
      snippet: first.snippet,
      name: result.knowledgeGraph?.title || companyName,
    };
  }

  throw new Error(`No website found for company name: ${companyName}`);
}

/**
 * Searches for competitors
 */
export async function searchCompetitors(companyName: string, apiKey?: string): Promise<SerperResult[]> {
  const query = `${companyName} competitors alternatives`;
  const result = await querySerper(query, apiKey);
  // Return top 5 search results
  return result.organic.slice(0, 5);
}
