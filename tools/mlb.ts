import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "mlb",
   serverVersion: "1.2.0",
   description: "MLB data and live scores",
} as const;

/**
 * The type of the input parameter for mlb_daily_schedule tool.
 */
export type mlb_daily_scheduleParams = {
  // Date in YYYY-MM-DD format (e.g., '2025-10-08'). If not provided, defaults to today.
  date?: string
}

/**
 * The type of the output of the mlb_daily_schedule tool.
 */
export type mlb_daily_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get MLB games scheduled for a specific date. Returns games with status (scheduled/inprogress/closed), scores, times, and venues. Best for checking today's games or live scores. Much more focused than the full season schedule.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function mlb_daily_schedule(
  sdk: ServerSdk,
  params: mlb_daily_scheduleParams
): Promise<mlb_daily_scheduleOutput> {
  return await sdk.callTool("mlb/1.2.0/mlb_daily_schedule", params) as mlb_daily_scheduleOutput;
}

/**
 * The type of the input parameter for mlb_league_schedule tool.
 */
export type mlb_league_scheduleParams = {
  // Optional: Team alias to filter results. If not provided, returns full schedule. Common aliases: ATL (Braves), BAL (Orioles), BOS (Red Sox), CHC (Cubs), CHW (White Sox), CIN (Reds), CLE (Guardians), COL (Rockies), DET (Tigers), HOU (Astros), KC (Royals), LAA (Angels), LAD (Dodgers), MIA (Marlins), MIL (Brewers), MIN (Twins), NYM (Mets), NYY (Yankees), OAK (Athletics), PHI (Phillies), PIT (Pirates), SD (Padres), SEA (Mariners), SF (Giants), STL (Cardinals), TB (Rays), TEX (Rangers), TOR (Blue Jays), WSH (Nationals).
  team_alias?: string,
  // Season type: PRE (Preseason), REG (Regular Season), PST (Postseason), AST (All-Star). Defaults to REG.
  season_type?: ('PRE' | 'REG' | 'PST' | 'AST'),
  // The season year (e.g., 2025, 2024). If not provided, defaults to current year.
  season_year?: number
}

/**
 * The type of the output of the mlb_league_schedule tool.
 */
export type mlb_league_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get full MLB league schedule. Returns games with dates, times, teams, venues, scores, and game status. IMPORTANT: STRONGLY recommended to use the team_alias parameter to filter by team - this significantly reduces response size and improves performance.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function mlb_league_schedule(
  sdk: ServerSdk,
  params: mlb_league_scheduleParams
): Promise<mlb_league_scheduleOutput> {
  return await sdk.callTool("mlb/1.2.0/mlb_league_schedule", params) as mlb_league_scheduleOutput;
}

/**
 * The type of the input parameter for mlb_game_boxscore tool.
 */
export type mlb_game_boxscoreParams = {
  // The unique game ID from Sportradar (obtained from the league schedule). Format is typically a UUID.
  game_id: string
}

/**
 * The type of the output of the mlb_game_boxscore tool.
 */
export type mlb_game_boxscoreOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get detailed game boxscore with inning-by-inning scoring, player stats, runs, hits, errors, and current game state. Returns comprehensive statistics including pitcher outcomes, baserunners, and play-by-play data. Real-time updates for live games (2-second cache).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function mlb_game_boxscore(
  sdk: ServerSdk,
  params: mlb_game_boxscoreParams
): Promise<mlb_game_boxscoreOutput> {
  return await sdk.callTool("mlb/1.2.0/mlb_game_boxscore", params) as mlb_game_boxscoreOutput;
}

/**
 * The type of the input parameter for mlb_season_standings tool.
 */
export type mlb_season_standingsParams = {
  // Season type: PRE (Preseason), REG (Regular Season), PST (Postseason), AST (All-Star). Defaults to REG.
  season_type?: ('PRE' | 'REG' | 'PST' | 'AST'),
  // The season year (e.g., 2025, 2024). If not provided, defaults to current year.
  season_year?: number
}

/**
 * The type of the output of the mlb_season_standings tool.
 */
export type mlb_season_standingsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get MLB season standings with team records, win/loss statistics, winning percentages, games behind, and current streaks. Returns comprehensive standings data organized by league and division (AL East, AL Central, AL West, NL East, NL Central, NL West).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function mlb_season_standings(
  sdk: ServerSdk,
  params: mlb_season_standingsParams
): Promise<mlb_season_standingsOutput> {
  return await sdk.callTool("mlb/1.2.0/mlb_season_standings", params) as mlb_season_standingsOutput;
}


