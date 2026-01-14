import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "nfl",
   serverVersion: "1.2.0",
   description: "NFL data and live scores",
} as const;

/**
 * The type of the input parameter for nfl_season_schedule tool.
 */
export type nfl_season_scheduleParams = {
  // Optional: Team alias to filter results. If not provided, returns full schedule. Valid aliases: ARI (Cardinals), ATL (Falcons), BAL (Ravens), BUF (Bills), CAR (Panthers), CHI (Bears), CIN (Bengals), CLE (Browns), DAL (Cowboys), DEN (Broncos), DET (Lions), GB (Packers), HOU (Texans), IND (Colts), JAX (Jaguars), KC (Chiefs), LV (Raiders), LAC (Chargers), LAR (Rams), MIA (Dolphins), MIN (Vikings), NE (Patriots), NO (Saints), NYG (Giants), NYJ (Jets), PHI (Eagles), PIT (Steelers), SF (49ers), SEA (Seahawks), TB (Buccaneers), TEN (Titans), WAS (Commanders).
  team_alias?: string
}

/**
 * The type of the output of the nfl_season_schedule tool.
 */
export type nfl_season_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get full NFL season schedule. Returns comprehensive game information including teams, venues, scores, status (scheduled, inprogress, complete), and broadcast details. IMPORTANT: STRONGLY recommended to use the team_alias parameter to filter by team - this significantly reduces response size and improves performance.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nfl_season_schedule(
  sdk: ServerSdk,
  params: nfl_season_scheduleParams
): Promise<nfl_season_scheduleOutput> {
  return await sdk.callTool("nfl/1.2.0/nfl_season_schedule", params) as nfl_season_scheduleOutput;
}

/**
 * The type of the input parameter for nfl_game_boxscore tool.
 */
export type nfl_game_boxscoreParams = {
  // The unique game ID from Sportradar (obtained from the season schedule). Format is typically a UUID like 'a13245ef-cbd8-4fe9-84dc-871daf34ff34'.
  game_id: string
}

/**
 * The type of the output of the nfl_game_boxscore tool.
 */
export type nfl_game_boxscoreOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get detailed boxscore and play-by-play information for a specific NFL game. Returns real-time scoring information, quarter-by-quarter scores, player and team statistics, game status, and complete play-by-play details. Use this for live scores when games are in progress or detailed stats after completion.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nfl_game_boxscore(
  sdk: ServerSdk,
  params: nfl_game_boxscoreParams
): Promise<nfl_game_boxscoreOutput> {
  return await sdk.callTool("nfl/1.2.0/nfl_game_boxscore", params) as nfl_game_boxscoreOutput;
}

/**
 * The type of the input parameter for nfl_season_standings tool.
 */
export type nfl_season_standingsParams = {
  // The season type: REG (Regular Season), PRE (Preseason), PST (Postseason). Defaults to REG.
  season_type?: ('REG' | 'PRE' | 'PST'),
  // The season year (e.g., 2025, 2024). If not provided, defaults to current season.
  season_year?: number
}

/**
 * The type of the output of the nfl_season_standings tool.
 */
export type nfl_season_standingsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get NFL season standings with detailed records for divisions and conferences. Returns comprehensive standings information including overall records, division/conference records, home/road records, winning/losing streaks, and team rankings. Updated every 2 minutes after games complete.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nfl_season_standings(
  sdk: ServerSdk,
  params: nfl_season_standingsParams
): Promise<nfl_season_standingsOutput> {
  return await sdk.callTool("nfl/1.2.0/nfl_season_standings", params) as nfl_season_standingsOutput;
}

/**
 * The type of the input parameter for nfl_team_profile tool.
 */
export type nfl_team_profileParams = {
  // The unique team ID from Sportradar (obtained from the season schedule). Format is typically a UUID like '386bdbf9-9eea-4869-bb9a-274b0bc66e80'.
  team_id: string
}

/**
 * The type of the output of the nfl_team_profile tool.
 */
export type nfl_team_profileOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get comprehensive NFL team profile including franchise information, active roster, coaches, venue details, team colors, and historical achievements. Returns detailed player information (name, position, experience, jersey number), team metadata (championships, founding year, owner), and venue information. Updated in realtime as roster or player profile changes are made.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nfl_team_profile(
  sdk: ServerSdk,
  params: nfl_team_profileParams
): Promise<nfl_team_profileOutput> {
  return await sdk.callTool("nfl/1.2.0/nfl_team_profile", params) as nfl_team_profileOutput;
}


