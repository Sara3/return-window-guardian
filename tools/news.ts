import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "news",
   serverVersion: "1.0.0",
   description: "Access news headlines and summaries from a wide range of sources",
} as const;

/**
 * The type of the input parameter for hackerNewsTopStories tool.
 */
export type hackerNewsTopStoriesParams = {
  // Number of top stories to fetch (1-30, default: 30)
  limit?: number
}

/**
 * The type of the output of the hackerNewsTopStories tool.
 */
export type hackerNewsTopStoriesOutput = {
  count?: number,
  error?: {
    type: string,
    message: string
  },
  stories?: Array<{
    id: number,
    url: string,
    score: number,
    title: string
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Fetch top stories from Hacker News with scores and URLs
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function hackerNewsTopStories(
  sdk: ServerSdk,
  params: hackerNewsTopStoriesParams
): Promise<hackerNewsTopStoriesOutput> {
  return await sdk.callTool("news/1.0.0/hackerNewsTopStories", params) as hackerNewsTopStoriesOutput;
}

/**
 * The type of the input parameter for cnnTopStories tool.
 */
export type cnnTopStoriesParams = {

}

/**
 * The type of the output of the cnnTopStories tool.
 */
export type cnnTopStoriesOutput = {
  count?: number,
  error?: {
    type: string,
    message: string
  },
  stories?: Array<{
    url: string,
    title: string
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Fetch top stories from CNN Lite by parsing the homepage
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function cnnTopStories(
  sdk: ServerSdk,
  params: cnnTopStoriesParams
): Promise<cnnTopStoriesOutput> {
  return await sdk.callTool("news/1.0.0/cnnTopStories", params) as cnnTopStoriesOutput;
}

/**
 * The type of the input parameter for bbcNewsHeadlines tool.
 */
export type bbcNewsHeadlinesParams = {
  // Number of headlines to fetch (1-50, default: 20)
  limit?: number
}

/**
 * The type of the output of the bbcNewsHeadlines tool.
 */
export type bbcNewsHeadlinesOutput = {
  count?: number,
  error?: {
    type: string,
    message: string
  },
  stories?: Array<{
    link: string,
    title: string,
    pubDate: string,
    imageUrl?: string,
    description: string
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Fetch news headlines from BBC News RSS feed with descriptions and publication dates
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function bbcNewsHeadlines(
  sdk: ServerSdk,
  params: bbcNewsHeadlinesParams
): Promise<bbcNewsHeadlinesOutput> {
  return await sdk.callTool("news/1.0.0/bbcNewsHeadlines", params) as bbcNewsHeadlinesOutput;
}

/**
 * The type of the input parameter for headlines tool.
 */
export type headlinesParams = {
  // The news topic to search for (e.g., 'artificial intelligence', 'politics', 'climate change', 'tech industry', 'sports')
  topic: string
}

/**
 * The type of the output of the headlines tool.
 */
export type headlinesOutput = {
  count?: number,
  error?: {
    type: string,
    message: string
  },
  topic?: string,
  success: boolean,
  fetchedAt: string,
  headlines?: Array<{
    url: string,
    score?: number,
    title: string,
    source: string,
    pubDate?: string,
    description?: string
  }>
}

/**
 * PRIMARY TOOL FOR BREAKING NEWS AND CURRENT EVENTS. Searches and filters real-time headlines from multiple live news sources (Hacker News, CNN, BBC) for any topic. Use this tool FIRST when users ask about recent news, current events, breaking stories, or 'what's happening' about any subject. Returns up-to-the-minute news filtered by AI relevance. Sources update continuously throughout the day.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function headlines(
  sdk: ServerSdk,
  params: headlinesParams
): Promise<headlinesOutput> {
  return await sdk.callTool("news/1.0.0/headlines", params) as headlinesOutput;
}


