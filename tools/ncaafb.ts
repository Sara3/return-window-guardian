import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "ncaafb",
   serverVersion: "1.2.0",
   description: "NCAA data and live scores",
} as const;

/**
 * The type of the input parameter for ncaafb_season_schedule tool.
 */
export type ncaafb_season_scheduleParams = {
  // Optional team alias to filter results (e.g., 'ALA' for Alabama, 'OSU' for Ohio State, 'UGA' for Georgia, 'MICH' for Michigan, 'TEX' for Texas, 'USC' for USC, 'ND' for Notre Dame). Team aliases vary by school. If not provided, returns all games for the season.
  team_alias?: string
}

/**
 * The type of the output of the ncaafb_season_schedule tool.
 */
export type ncaafb_season_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get current NCAA Football (college football) season schedule. Returns comprehensive game information including teams, venues, scores, status (scheduled, inprogress, complete), broadcast details, and playoff/tournament information. IMPORTANT: STRONGLY recommended to use the team_alias parameter to filter by team - this significantly reduces response size and improves performance.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function ncaafb_season_schedule(
  sdk: ServerSdk,
  params: ncaafb_season_scheduleParams
): Promise<ncaafb_season_scheduleOutput> {
  return await sdk.callTool("ncaafb/1.2.0/ncaafb_season_schedule", params) as ncaafb_season_scheduleOutput;
}

/**
 * The type of the input parameter for ncaafb_game_boxscore tool.
 */
export type ncaafb_game_boxscoreParams = {
  // The unique game ID from Sportradar (obtained from the season schedule). Format is typically a UUID like 'a13245ef-cbd8-4fe9-84dc-871daf34ff34'.
  game_id: string
}

/**
 * The type of the output of the ncaafb_game_boxscore tool.
 */
export type ncaafb_game_boxscoreOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get detailed boxscore and play-by-play information for a specific NCAA Football game. Returns real-time scoring information, quarter-by-quarter scores, player and team statistics, game status, drive summaries, and complete play-by-play details. Use this for live scores when games are in progress or detailed stats after completion.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function ncaafb_game_boxscore(
  sdk: ServerSdk,
  params: ncaafb_game_boxscoreParams
): Promise<ncaafb_game_boxscoreOutput> {
  return await sdk.callTool("ncaafb/1.2.0/ncaafb_game_boxscore", params) as ncaafb_game_boxscoreOutput;
}

/**
 * The type of the input parameter for ncaafb_season_standings tool.
 */
export type ncaafb_season_standingsParams = {
  // The season type: REG (Regular Season), PST (Postseason). Defaults to REG.
  season_type?: ('REG' | 'PST'),
  // The season year (e.g., 2025, 2024). If not provided, defaults to current season.
  season_year?: number
}

/**
 * The type of the output of the ncaafb_season_standings tool.
 */
export type ncaafb_season_standingsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get NCAA Football season standings with detailed records for conferences and divisions. Returns comprehensive standings information including overall records, conference/division records, home/road/neutral records, winning/losing streaks, and team rankings. Updated every 2 minutes after games complete.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function ncaafb_season_standings(
  sdk: ServerSdk,
  params: ncaafb_season_standingsParams
): Promise<ncaafb_season_standingsOutput> {
  return await sdk.callTool("ncaafb/1.2.0/ncaafb_season_standings", params) as ncaafb_season_standingsOutput;
}

/**
 * The type of the input parameter for ncaafb_team_roster tool.
 */
export type ncaafb_team_rosterParams = {
  // The unique team ID from Sportradar (obtained from the season schedule). Format is typically a UUID like 'a13245ef-cbd8-4fe9-84dc-871daf34ff34'.
  team_id: string
}

/**
 * The type of the output of the ncaafb_team_roster tool.
 */
export type ncaafb_team_rosterOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get comprehensive NCAA Football team roster including franchise information, active players, coaches, venue details, and team metadata. Returns detailed player information (name, position, jersey number, height, weight, status, eligibility), team details (alias, championships, founding year), and venue information. Updated in realtime as roster or player profile changes are made.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function ncaafb_team_roster(
  sdk: ServerSdk,
  params: ncaafb_team_rosterParams
): Promise<ncaafb_team_rosterOutput> {
  return await sdk.callTool("ncaafb/1.2.0/ncaafb_team_roster", params) as ncaafb_team_rosterOutput;
}


