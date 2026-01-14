import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "persondata",
   serverVersion: "1.0.1",
   description: "This tool can find data about people which is not often available via search by using sources like LinkedIn.",
} as const;

/**
 * The type of the input parameter for linkedin tool.
 */
export type linkedinParams = {
  // The LinkedIn profile URL to analyze
  linkedin_url: string
}

/**
 * The type of the output of the linkedin tool.
 */
export type linkedinOutput = {
  error?: {
    type: string,
    message: string
  },
  posts?: any,
  profile?: any,
  success: boolean,
  fetchedAt: string
}

/**
 * Get LinkedIn profile data and recent posts for a given LinkedIn profile URL
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function linkedin(
  sdk: ServerSdk,
  params: linkedinParams
): Promise<linkedinOutput> {
  return await sdk.callTool("persondata/1.0.1/linkedin", params) as linkedinOutput;
}

/**
 * The type of the input parameter for personResearch tool.
 */
export type personResearchParams = {
  // The person's full name (required)
  name: string,
  // Their email address (optional)
  email?: string,
  // The company they work at (optional)
  company?: string,
  // Their location, e.g. 'San Francisco' (optional)
  location?: string
}

/**
 * The type of the output of the personResearch tool.
 */
export type personResearchOutput = {
  error?: {
    type: string,
    message: string
  },
  posts?: any,
  profile?: any,
  // Sources used for general research
  sources?: Array<{
    url?: string,
    title?: string
  }>,
  success: boolean,
  fetchedAt: string,
  // The discovered LinkedIn profile URL, if found
  linkedinUrl?: string,
  // Whether LinkedIn data or general research was returned
  researchType: ('linkedin' | 'general'),
  // General research about the person if LinkedIn wasn't available
  generalResearch?: string
}

/**
 * Research a person by name and optionally company, email, or location. Attempts to find their LinkedIn profile first, then falls back to general web research if LinkedIn is unavailable.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function personResearch(
  sdk: ServerSdk,
  params: personResearchParams
): Promise<personResearchOutput> {
  return await sdk.callTool("persondata/1.0.1/personResearch", params) as personResearchOutput;
}


