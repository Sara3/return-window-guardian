import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "posts",
   serverVersion: "1.1.0",
   description: "Allows your agent to post to the feed",
} as const;

/**
 * The type of the input parameter for create_agent_post tool.
 */
export type create_agent_postParams = {
  duration: 'read_once',
  // The priority of the post. Use `urgent` if a push notification should be sent to the user. Use `normal` for all other posts.
  priority: (('normal' | 'urgent') | null),
  // Attachments to the post. Use `markdown` for generic text content and `url` for links to external resources. We should use `url` whenever possible to help the user get more value.
  attachments: Array<({
    type: 'markdown',
    content: string
  } | {
    type: 'url',
    content: string
  })>,
  // The short message for the agent post that will be the notification title
  shortMessage: string
}

/**
 * The type of the output of the create_agent_post tool.
 */
export type create_agent_postOutput = {
  success: boolean
}

/**
 *  Creates an agent post to surface important information or results to the user. Only use for the OUTPUT of your agent run - do NOT use this just to announce that you ran, as the system already tracks agent execution.  Always add source URLs as their own attachment if they exist. 
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function create_agent_post(
  sdk: ServerSdk,
  params: create_agent_postParams
): Promise<create_agent_postOutput> {
  return await sdk.callTool("posts/1.1.0/create_agent_post", params) as create_agent_postOutput;
}

/**
 * The type of the input parameter for get_agent_post_history tool.
 */
export type get_agent_post_historyParams = {
  // Number of results to skip (default: 0, zero-indexed)
  offset?: number,
  // Number of days back to retrieve posts (default: 10)
  daysBack: (number | null),
  // Maximum number of results per page (default: 10)
  maxResults?: number
}

/**
 * The type of the output of the get_agent_post_history tool.
 */
export type get_agent_post_historyOutput = {
  posts: Array<{
    id: string,
    status: string,
    createdAt: string,
    shortMessage: string,
    hasAttachments: boolean,
    attachmentContents: string
  }>,
  offset: number,
  daysBack: number,
  maxResults: number,
  totalCount: number
}

/**
 * Retrieves the agent's post history from the last 10 days to understand what has already been communicated to the user. Use this to avoid repeating information and to decide whether to update existing posts or create new ones.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_agent_post_history(
  sdk: ServerSdk,
  params: get_agent_post_historyParams
): Promise<get_agent_post_historyOutput> {
  return await sdk.callTool("posts/1.1.0/get_agent_post_history", params) as get_agent_post_historyOutput;
}

/**
 * The type of the input parameter for mark_all_posts_as_read tool.
 */
export type mark_all_posts_as_readParams = {
  // Optional agent ID to limit marking posts as read to a specific agent. If not provided, will use the calling agent's ID, or mark all posts if called by Sidekick in an interactive context.
  agentId?: (string | null)
}

/**
 * The type of the output of the mark_all_posts_as_read tool.
 */
export type mark_all_posts_as_readOutput = {
  success: boolean
}

/**
 * Marks active posts as read. When called by an agent, always marks only that agent's posts (agentId parameter is ignored). When called by Sidekick, can optionally specify an agentId to mark posts from a specific agent, or omit it to mark ALL posts for the user.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function mark_all_posts_as_read(
  sdk: ServerSdk,
  params: mark_all_posts_as_readParams
): Promise<mark_all_posts_as_readOutput> {
  return await sdk.callTool("posts/1.1.0/mark_all_posts_as_read", params) as mark_all_posts_as_readOutput;
}


