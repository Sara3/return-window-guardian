import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "rss-explorer",
   serverVersion: "1.0.0",
   description: "Explore popular RSS feeds",
} as const;

/**
 * The type of the input parameter for fetchRSSFeed tool.
 */
export type fetchRSSFeedParams = {
  // The RSS feed URL to fetch and parse
  url: string,
  // Maximum number of items to return
  limit: number
}

/**
 * The type of the output of the fetchRSSFeed tool.
 */
export type fetchRSSFeedOutput = {
  url?: string,
  feed?: {
    link?: string,
    items: Array<{
      link: string,
      title: string,
      content: string,
      imageUrl?: string,
      description: string
    }>,
    title?: string,
    description?: string
  },
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string,
  itemCount?: number
}

/**
 * Fetch and RSS feed by its URL and returns parsed title, description and content.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function fetchRSSFeed(
  sdk: ServerSdk,
  params: fetchRSSFeedParams
): Promise<fetchRSSFeedOutput> {
  return await sdk.callTool("rss-explorer/1.0.0/fetchRSSFeed", params) as fetchRSSFeedOutput;
}

/**
 * The type of the input parameter for listRSSFeeds tool.
 */
export type listRSSFeedsParams = {

}

/**
 * The type of the output of the listRSSFeeds tool.
 */
export type listRSSFeedsOutput = {
  feeds: {

  },
  success: boolean,
  feedCount: number,
  fetchedAt: string,
  categories: Array<string>
}

/**
 * List RSS feeds and a description of what they are about, the categories they belong to, and the URL of the feed.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listRSSFeeds(
  sdk: ServerSdk,
  params: listRSSFeedsParams
): Promise<listRSSFeedsOutput> {
  return await sdk.callTool("rss-explorer/1.0.0/listRSSFeeds", params) as listRSSFeedsOutput;
}


