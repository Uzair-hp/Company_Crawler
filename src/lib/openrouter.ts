export interface ResearchData {
  companyName: string;
  tagline: string;
  website: string;
  industry: string;
  executiveSummary: string;
  offerings: { name: string; description: string }[];
  painPoints: { issue: string; impact: string }[];
  competitors: { name: string; url: string }[];
  contactInfo: {
    address: string;
    phone: string;
    email: string;
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  customFocusSummary?: string;
}

export const SUPPORTED_MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "meta-llama/llama-3-8b-instruct:free", name: "Llama 3 8B Instruct (Free)" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat V3" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
];

/**
 * Sends a prompt to OpenRouter and returns the text response
 */
export async function queryOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  modelId: string = "google/gemini-2.5-flash",
  customApiKey?: string
): Promise<string> {
  const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is missing. Please configure it in your environment or settings.");
  }

  const referer = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "AI Company Research Assistant",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" }, // Request JSON output format
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Error in queryOpenRouter:", error);
    throw error;
  }
}

/**
 * Analyzes crawled website content and Serper search results to generate a structured JSON report
 */
export async function analyzeCompanyData(
  companyName: string,
  websiteUrl: string,
  crawledPages: { url: string; title: string; text: string }[],
  serperContext: any,
  modelId: string = "google/gemini-2.5-flash",
  apiKey?: string,
  customFocus?: string
): Promise<ResearchData> {
  const systemPrompt = `You are an expert corporate analyst. Analyze the provided website crawl content and search results about a company.
Your output MUST be a valid JSON object matching this schema exactly (do not output markdown code blocks or any leading/trailing text outside the JSON):
{
  "companyName": "Exact Company Name",
  "tagline": "A single catchy, professional slogan or tagline representing the company",
  "website": "Official website URL",
  "industry": "Primary industry/niche",
  "executiveSummary": "A robust 3-4 sentence summary of what the company does, their mission, size/context, and value proposition.",
  "offerings": [
    {
      "name": "Product or Service Name",
      "description": "Clear 1-2 sentence description of this product/service and its key features."
    }
  ],
  "painPoints": [
    {
      "issue": "Specific customer pain point or business challenge they solve",
      "impact": "How their product/service mitigates or resolves this issue for their clients."
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "Competitor URL or 'N/A'"
    }
  ],
  "contactInfo": {
    "address": "Street address or N/A",
    "phone": "Phone number or N/A",
    "email": "Contact email or N/A"
  },
  "swot": {
    "strengths": ["Strength 1 (bullet list of 3-4 items)", "Strength 2"],
    "weaknesses": ["Weakness 1 (bullet list of 3-4 items)", "Weakness 2"],
    "opportunities": ["Opportunity 1 (bullet list of 3-4 items)", "Opportunity 2"],
    "threats": ["Threat 1 (bullet list of 3-4 items)", "Threat 2"]
  },
  "customFocusSummary": "If a custom focus keyword or query is specified, provide a 2-3 sentence analysis focusing strictly on that topic. Otherwise, output null or omit."
}`;

  const crawledContentText = crawledPages
    .map((page, idx) => `PAGE ${idx + 1} (${page.url}) - Title: ${page.title}\nContent:\n${page.text}`)
    .join("\n\n---\n\n");

  const serperResultsText = JSON.stringify(serperContext, null, 2);

  let userPrompt = `Generate a detailed profile for the company "${companyName}" (website: ${websiteUrl}).
Use the following data:

=== CRAWLED PAGES FROM OFFICIAL WEBSITE ===
${crawledContentText}

=== SEARCH ENGINE EXTRA CONTEXT & COMPETITORS ===
${serperResultsText}
`;

  if (customFocus && customFocus.trim()) {
    userPrompt += `
=== SPECIAL USER RESEARCH FOCUS ===
The user has requested to focus specifically on: "${customFocus}".
Analyze this aspect deeply. Ensure you populate the "customFocusSummary" field with a summary of findings for this topic, and highlight relevant items in the SWOT matrix.
`;
  }

  userPrompt += `
Synthesize this data into a highly professional, accurate JSON profile. Make sure the JSON complies with the schema exactly.`;

  const rawJson = await queryOpenRouter(systemPrompt, userPrompt, modelId, apiKey);
  
  try {
    // Strip markdown code block boundaries if LLM returned them despite JSON mode
    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    const parsed: ResearchData = JSON.parse(cleanJson);

    // Provide default fallbacks if missing
    return {
      companyName: parsed.companyName || companyName,
      tagline: parsed.tagline || "",
      website: parsed.website || websiteUrl,
      industry: parsed.industry || "Unknown",
      executiveSummary: parsed.executiveSummary || "",
      offerings: parsed.offerings || [],
      painPoints: parsed.painPoints || [],
      competitors: parsed.competitors || [],
      contactInfo: {
        address: parsed.contactInfo?.address || "N/A",
        phone: parsed.contactInfo?.phone || "N/A",
        email: parsed.contactInfo?.email || "N/A",
      },
      swot: {
        strengths: parsed.swot?.strengths || [],
        weaknesses: parsed.swot?.weaknesses || [],
        opportunities: parsed.swot?.opportunities || [],
        threats: parsed.swot?.threats || [],
      },
      customFocusSummary: parsed.customFocusSummary || undefined,
    };
  } catch (error) {
    console.error("Failed to parse AI JSON response:", rawJson);
    throw new Error("Failed to parse the structured analysis data from OpenRouter. Please try again.");
  }
}
