import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "perplexity",
   serverVersion: "1.1.0",
   description: "Research topics and answer questions with Perplexity",
} as const;

/**
 * The type of the input parameter for sonarSearch tool.
 */
export type sonarSearchParams = {
  // The search query or question to search for using Perplexity's Sonar model
  query: string,
  // Filter search results to specific domains/URLs (allowlist) or exclude domains/URLs (denylist with - prefix). Up to 20 entries. Use domain names (e.g., 'wikipedia.org') or full URLs (e.g., 'https://en.wikipedia.org/wiki/Chess'). Denylist mode: prefix with '-' (e.g., '-reddit.com'). Cannot mix allowlist and denylist in the same request.
  search_domain_filter?: Array<string>
}

/**
 * The type of the output of the sonarSearch tool.
 */
export type sonarSearchOutput = {
  error?: {
    type: string,
    message: string
  },
  result?: string,
  sources?: Array<{
    url: string,
    title: string
  }>,
  success: boolean
}

/**
 * Fast answers with reliable search results. CHEAPEST option - use this for quick facts, definitions, sports, health, finance content, or summarizing books/TV shows/movies. Perplexity is not good for up to the minute news - results are often outdated.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function sonarSearch(
  sdk: ServerSdk,
  params: sonarSearchParams
): Promise<sonarSearchOutput> {
  return await sdk.callTool("perplexity/1.1.0/sonarSearch", params) as sonarSearchOutput;
}

/**
 * The type of the input parameter for sonarProSearch tool.
 */
export type sonarProSearchParams = {
  // The complex research query requiring depth using Perplexity's Sonar Pro model
  query: string,
  // Filter search results to specific domains/URLs (allowlist) or exclude domains/URLs (denylist with - prefix). Up to 20 entries. Use domain names (e.g., 'wikipedia.org') or full URLs (e.g., 'https://en.wikipedia.org/wiki/Chess'). Denylist mode: prefix with '-' (e.g., '-reddit.com'). Cannot mix allowlist and denylist in the same request.
  search_domain_filter?: Array<string>
}

/**
 * The type of the output of the sonarProSearch tool.
 */
export type sonarProSearchOutput = {
  error?: {
    type: string,
    message: string
  },
  result?: string,
  sources?: Array<{
    url: string,
    title: string
  }>,
  success: boolean
}

/**
 * Advanced search model for complex queries with deeper content understanding and 2x more search results than standard Sonar. MORE EXPENSIVE - use for complex research questions, comparative analysis across multiple sources, information synthesis and detailed reporting. Perplexity is not good for up to the minute news - results are often outdated.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function sonarProSearch(
  sdk: ServerSdk,
  params: sonarProSearchParams
): Promise<sonarProSearchOutput> {
  return await sdk.callTool("perplexity/1.1.0/sonarProSearch", params) as sonarProSearchOutput;
}


