import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "sportsdata",
   serverVersion: "1.2.0",
   description: "Fresh NBA, NFL, MLB, international and other sports data.",
} as const;

/**
 * The type of the input parameter for sportsSearch tool.
 */
export type sportsSearchParams = {
  // The sports search query to execute. Handles various sports queries including team matchups, league standings, player stats, racing results, etc. All date/time results are automatically converted to your timezone.
  q: string
}

/**
 * The type of the output of the sportsSearch tool.
 */
export type sportsSearchOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  // The user's timezone used for date/time conversions (e.g., 'America/Los_Angeles', 'Europe/London')
  timezone: string,
  fetchedAt: string,
  sports_results?: any
}

/**
 * Search for sports data using Google search. Handles team sports results (Soccer, American Football, Basketball, Hockey, Baseball, Cricket), game spotlight results, sports results for athletes, auto and moto racing sports results, league standings, etc. Examples: 'Lakers vs Warriors', 'Premier League standings', 'NFL scores today', 'Messi career stats', 'Formula 1 championship results', 'World Cup matches', 'NBA playoffs bracket'
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function sportsSearch(
  sdk: ServerSdk,
  params: sportsSearchParams
): Promise<sportsSearchOutput> {
  return await sdk.callTool("sportsdata/1.2.0/sportsSearch", params) as sportsSearchOutput;
}


