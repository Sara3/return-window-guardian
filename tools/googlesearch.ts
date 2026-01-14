import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "googlesearch",
   serverVersion: "1.0.0",
   description: "Google Search - best in class web search tool with Gemini AI grounding for current events, factual queries, and general knowledge",
} as const;

/**
 * The type of the input parameter for askGemini tool.
 */
export type askGeminiParams = {
  // The question to answer
  query: string
}

/**
 * The type of the output of the askGemini tool.
 */
export type askGeminiOutput = {
  raw?: any,
  error?: {
    type: string,
    status?: number,
    details?: any,
    message: string
  },
  query?: string,
  answer?: string,
  sources?: Array<{
    url?: string,
    title?: string
  }>,
  success: boolean,
  fetchedAt: string,
  searchQueries?: Array<string>,
  groundingSupports?: Array<{
    text?: string,
    endIndex?: number,
    startIndex?: number,
    sourceIndices?: Array<number>
  }>
}

/**
 * AI-powered question answering tool that returns a synthesized answer with granular citations.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function askGemini(
  sdk: ServerSdk,
  params: askGeminiParams
): Promise<askGeminiOutput> {
  return await sdk.callTool("googlesearch/1.0.0/askGemini", params) as askGeminiOutput;
}

/**
 * The type of the input parameter for googleSearch tool.
 */
export type googleSearchParams = {
  // The search query - use natural language or keywords, just like searching on Google
  query: string
}

/**
 * The type of the output of the googleSearch tool.
 */
export type googleSearchOutput = {
  error?: {
    type: string,
    status?: number,
    details?: any,
    message: string
  },
  query?: string,
  results?: Array<{
    url?: string,
    title?: string,
    snippet?: string
  }>,
  success: boolean,
  fetchedAt: string,
  searchQueries?: Array<string>
}

/**
 * USE THIS AS YOUR DEFAULT WEB SEARCH TOOL. Traditional "ten blue links" web search results from Google. Returns a list of search results with snippets, titles, and URLs - similar to what you see on a Google search results page. Use this when you want: direct access to individual web sources, to scan multiple result snippets quickly, to get a variety of perspectives without AI synthesis, or when you need the specific URLs for citation. Each result includes the exact text snippet from the source and its URL.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function googleSearch(
  sdk: ServerSdk,
  params: googleSearchParams
): Promise<googleSearchOutput> {
  return await sdk.callTool("googlesearch/1.0.0/googleSearch", params) as googleSearchOutput;
}


