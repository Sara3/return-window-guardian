import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "triggers",
   serverVersion: "1.0.0",
   description: "Manage agents' triggers, allowing adding/removing personal triggers and listing all published/personal triggers",
} as const;

/**
 * The type of the input parameter for add_personal tool.
 */
export type add_personalParams = {
  trigger: ({
    name: string,
    type: 'cron',
    entrypoint: string,
    cronExpression: string
  } | {
    name: string,
    type: 'input',
    entrypoint: string,
    contentTypes?: Array<string>
  } | {
    name: string,
    type: 'email',
    filters: {
      to?: string,
      from?: string,
      labels?: Array<string>,
      subject?: string,
      hasAttachment?: boolean
    },
    entrypoint: string
  } | {
    name?: string,
    type: 'webhook',
    entrypoint: string
  }),
  // Optional agent ID to add the trigger to. If not provided, adds to the calling agent. Only Sidekick can specify an agent other than itself.
  targetAgentId?: string
}

/**
 * The type of the output of the add_personal tool.
 */
export type add_personalOutput = {
  error?: string,
  success: boolean,
  trigger?: ({
    name: string,
    type: 'cron',
    entrypoint: string,
    cronExpression: string
  } | {
    name: string,
    type: 'input',
    entrypoint: string,
    contentTypes?: Array<string>
  } | {
    name: string,
    type: 'email',
    filters: {
      to?: string,
      from?: string,
      labels?: Array<string>,
      subject?: string,
      hasAttachment?: boolean
    },
    entrypoint: string
  } | {
    name?: string,
    type: 'webhook',
    webhookId: string,
    entrypoint: string
  })
}

/**
 * Add a personal trigger to an agent instance. Personal triggers are specific to this user's installation and are NOT copied when other users install the agent from the gallery.  Use personal triggers when: - The trigger is specific to this user's workflow or preferences (e.g., "check my email at 9 AM") - The trigger depends on user-specific data or context - You want to customize timing or criteria for this particular user  DO NOT use personal triggers for: - Core agent functionality that all users of the agent should have in an identical way - Triggers that are intended to have the same criteria/timing for every user - Triggers required for key functionality, unless the agent's code is capable of creating those triggers  If you're unsure, use personal triggers - users can always move them to published triggers later by editing agent.yml.  Note: Triggers (both published and personal) can share entrypoints, so long as they have otherwise unique configuration.  Security: The targetAgentId parameter allows modifying triggers for other agents. Only the Sidekick agent can modify triggers for other agents - non-Sidekick agents can only modify their own triggers.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function add_personal(
  sdk: ServerSdk,
  params: add_personalParams
): Promise<add_personalOutput> {
  return await sdk.callTool("triggers/1.0.0/add_personal", params) as add_personalOutput;
}

/**
 * The type of the input parameter for list tool.
 */
export type listParams = {
  // Optional agent ID to list triggers for. If not provided, lists triggers for the calling agent. Only Sidekick can specify an agent other than itself.
  targetAgentId?: string
}

/**
 * The type of the output of the list tool.
 */
export type listOutput = {
  personalTriggers: Array<any>,
  publishedTriggers: Array<({
    name: string,
    type: 'cron',
    entrypoint: string,
    cronExpression: string
  } | {
    name: string,
    type: 'input',
    entrypoint: string,
    contentTypes?: Array<string>
  } | {
    name: string,
    type: 'email',
    filters: {
      to?: string,
      from?: string,
      labels?: Array<string>,
      subject?: string,
      hasAttachment?: boolean
    },
    entrypoint: string
  } | {
    name?: string,
    type: 'webhook',
    webhookId: string,
    entrypoint: string
  })>
}

/**
 * List all triggers for an agent, separated into published triggers and personal triggers.  Published triggers: - Defined in the agent's code/configuration (agent.yml) - Copied when users install or remix the agent from gallery - Same for all users (unless customized)  Personal triggers: - Created at runtime by the agent, by Sidekick or coding agents (using the triggers tool), or manually by the user - Specific to this user's installation - Never copied to other users  Security: The targetAgentId parameter allows listing triggers for other agents. Only the Sidekick agent can list triggers for other agents - non-Sidekick agents can only list their own triggers.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function list(
  sdk: ServerSdk,
  params: listParams
): Promise<listOutput> {
  return await sdk.callTool("triggers/1.0.0/list", params) as listOutput;
}

/**
 * The type of the input parameter for remove_personal tool.
 */
export type remove_personalParams = {
  trigger: ({
    name: string,
    type: 'cron',
    entrypoint: string,
    cronExpression: string
  } | {
    name: string,
    type: 'input',
    entrypoint: string,
    contentTypes?: Array<string>
  } | {
    name: string,
    type: 'email',
    filters: {
      to?: string,
      from?: string,
      labels?: Array<string>,
      subject?: string,
      hasAttachment?: boolean
    },
    entrypoint: string
  } | {
    name?: string,
    type: 'webhook',
    webhookId: string,
    entrypoint: string
  }),
  // Optional agent ID to remove the trigger from. If not provided, removes from the calling agent. Only Sidekick can specify an agent other than itself.
  targetAgentId?: string
}

/**
 * The type of the output of the remove_personal tool.
 */
export type remove_personalOutput = {
  error?: string,
  success: boolean,
  trigger?: ({
    name: string,
    type: 'cron',
    entrypoint: string,
    cronExpression: string
  } | {
    name: string,
    type: 'input',
    entrypoint: string,
    contentTypes?: Array<string>
  } | {
    name: string,
    type: 'email',
    filters: {
      to?: string,
      from?: string,
      labels?: Array<string>,
      subject?: string,
      hasAttachment?: boolean
    },
    entrypoint: string
  } | {
    name?: string,
    type: 'webhook',
    webhookId: string,
    entrypoint: string
  })
}

/**
 * Remove a personal trigger, specified by its current configuration.  This only removes personal triggers, not published triggers. To remove a published trigger, edit the associated agent.yml file.  Security: The targetAgentId parameter allows removing triggers from other agents. Only the Sidekick agent can remove triggers from other agents - non-Sidekick agents can only remove their own triggers.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function remove_personal(
  sdk: ServerSdk,
  params: remove_personalParams
): Promise<remove_personalOutput> {
  return await sdk.callTool("triggers/1.0.0/remove_personal", params) as remove_personalOutput;
}

/**
 * The type of the input parameter for get_webhook_urls tool.
 */
export type get_webhook_urlsParams = {
  // Optional agent ID to get webhook URLs for. If not provided, gets URLs for the calling agent. Only Sidekick can specify an agent other than itself.
  targetAgentId?: string
}

/**
 * The type of the output of the get_webhook_urls tool.
 */
export type get_webhook_urlsOutput = {
  webhooks: Array<{
    id: string,
    url: string,
    createdAt: string,
    triggerCount: number,
    lastTriggeredAt?: string
  }>
}

/**
 * Get all webhook URLs for an agent.  This returns all active webhook URLs that can be called by external services, including: - The webhook ID (used in trigger configuration) - The full webhook URL - Creation time and usage statistics  Use this to retrieve webhook URLs that agents can share with external services or display to users. Agents should first call 'list' to see webhook triggers, then call this to get the corresponding URLs.  Security: The targetAgentId parameter allows retrieving webhook URLs for other agents. Only the Sidekick agent can retrieve webhook URLs for other agents - non-Sidekick agents can only retrieve their own webhook URLs.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_webhook_urls(
  sdk: ServerSdk,
  params: get_webhook_urlsParams
): Promise<get_webhook_urlsOutput> {
  return await sdk.callTool("triggers/1.0.0/get_webhook_urls", params) as get_webhook_urlsOutput;
}


