import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "exa",
   serverVersion: "1.0.2",
   description: "Enables your sidekick to search the web",
} as const;

/**
 * The type of the input parameter for exaWebSearch tool.
 */
export type exaWebSearchParams = {
  // The search query to find relevant web content
  query: string,
  // Include an LLM-generated summary of the page content
  summary?: boolean,
  // Number of search results to return (default: 10)
  numResults?: number,
  // Maximum characters to include in content text
  maxCharacters?: number,
  // Use Exa's autoprompt feature
  useAutoprompt?: boolean,
  // Exclude specific domains from results
  excludeDomains?: Array<string>,
  // Limit results to specific domains
  includeDomains?: Array<string>,
  // HTML selector for content to highlight
  highlightSelector?: string
}

/**
 * The type of the output of the exaWebSearch tool.
 */
export type exaWebSearchOutput = {
  raw?: any,
  error?: {
    type: string,
    status?: number,
    details?: any,
    message: string
  },
  query?: string,
  params?: {
    summary?: boolean,
    numResults?: number,
    maxCharacters?: number,
    useAutoprompt?: boolean,
    excludeDomains?: Array<string>,
    includeDomains?: Array<string>,
    highlightSelector?: string
  },
  results?: Array<{
    url?: string,
    text?: string,
    score?: number,
    title?: string,
    author?: string,
    summary?: string,
    highlights?: Array<string>,
    publishedDate?: string
  }>,
  success: boolean,
  fetchedAt: string,
  totalResults?: number
}

/**
 * Search the web using Exa and return structured results with advanced filtering and content extraction capabilities. In general, prefer to use Google tools when available. Use this tool only when you think it's better for the job.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function exaWebSearch(
  sdk: ServerSdk,
  params: exaWebSearchParams
): Promise<exaWebSearchOutput> {
  return await sdk.callTool("exa/1.0.2/exaWebSearch", params) as exaWebSearchOutput;
}


