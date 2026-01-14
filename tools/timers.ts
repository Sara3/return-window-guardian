import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "timers",
   serverVersion: "1.0.0",
   description: "Set and manage timers to run tasks at a future time. This can be used to run tasks after a delay, run a task once at a specific timer, or defer processing to a later time.",
} as const;

/**
 * The type of the input parameter for set tool.
 */
export type setParams = {
  params?: {

  },
  // The function name to call (defaults to 'main')
  entrypoint?: string,
  // ISO 8601 timestamp when to run (e.g., '2024-10-29T20:00:00Z')
  scheduledTime: string
}

/**
 * The type of the output of the set tool.
 */
export type setOutput = {
  error?: string,
  agentId?: string,
  success: boolean,
  timerId?: string,
  entrypoint?: string,
  scheduledTime?: string
}

/**
 * Set a timer for this agent to run at a future time. Like setTimeout in JavaScript - one-time execution.  Use this when you need to: - Run a task after a delay (e.g., "remind me in 5 hours") - Schedule a specific future time (e.g., "run at 3 AM tomorrow") - Defer processing to a later time  The timer will execute the specified entrypoint function with the given parameters at the scheduled time.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function set(
  sdk: ServerSdk,
  params: setParams
): Promise<setOutput> {
  return await sdk.callTool("timers/1.0.0/set", params) as setOutput;
}

/**
 * The type of the input parameter for list tool.
 */
export type listParams = {

}

/**
 * The type of the output of the list tool.
 */
export type listOutput = {
  error?: string,
  success: boolean,
  totalCount?: number,
  agentTimers?: Array<{
    id: string,
    params?: {

    },
    createdAt: string,
    entrypoint: string,
    scheduledTime: string
  }>
}

/**
 * List all pending timers for this agent
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function list(
  sdk: ServerSdk,
  params: listParams
): Promise<listOutput> {
  return await sdk.callTool("timers/1.0.0/list", params) as listOutput;
}

/**
 * The type of the input parameter for cancel tool.
 */
export type cancelParams = {
  // The ID of the timer to cancel
  agentTimerId: string
}

/**
 * The type of the output of the cancel tool.
 */
export type cancelOutput = {
  error?: string,
  success: boolean
}

/**
 * Cancel a pending timer
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function cancel(
  sdk: ServerSdk,
  params: cancelParams
): Promise<cancelOutput> {
  return await sdk.callTool("timers/1.0.0/cancel", params) as cancelOutput;
}


