import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "nba",
   serverVersion: "1.3.0",
   description: "NBA data and live scores",
} as const;

/**
 * The type of the input parameter for nba_daily_schedule tool.
 */
export type nba_daily_scheduleParams = {
  // Date in YYYY-MM-DD format (e.g., '2025-10-08'). If not provided, defaults to today.
  date?: string
}

/**
 * The type of the output of the nba_daily_schedule tool.
 */
export type nba_daily_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get NBA games scheduled for a specific date. Returns games with status (scheduled/inprogress/closed), scores, times, venues, and broadcast info. Best for checking today's games or live scores. Very short 10-second cache for real-time updates.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nba_daily_schedule(
  sdk: ServerSdk,
  params: nba_daily_scheduleParams
): Promise<nba_daily_scheduleOutput> {
  return await sdk.callTool("nba/1.3.0/nba_daily_schedule", params) as nba_daily_scheduleOutput;
}

/**
 * The type of the input parameter for nba_season_schedule tool.
 */
export type nba_season_scheduleParams = {
  // Optional: Team alias to filter results. If not provided, returns full schedule. Common aliases: ATL (Hawks), BOS (Celtics), BKN (Nets), CHA (Hornets), CHI (Bulls), CLE (Cavaliers), DAL (Mavericks), DEN (Nuggets), DET (Pistons), GSW (Warriors), HOU (Rockets), IND (Pacers), LAC (Clippers), LAL (Lakers), MEM (Grizzlies), MIA (Heat), MIL (Bucks), MIN (Timberwolves), NOP (Pelicans), NYK (Knicks), OKC (Thunder), ORL (Magic), PHI (76ers), PHX (Suns), POR (Trail Blazers), SAC (Kings), SAS (Spurs), TOR (Raptors), UTA (Jazz), WAS (Wizards).
  team_alias?: string,
  // Season type: PRE (Preseason), REG (Regular Season), PST (Postseason), AST (All-Star). Defaults to REG.
  season_type?: ('PRE' | 'REG' | 'PST' | 'AST'),
  // The season year (e.g., 2025, 2024). If not provided, defaults to current year.
  season_year?: number
}

/**
 * The type of the output of the nba_season_schedule tool.
 */
export type nba_season_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get full NBA season schedule. Returns games with dates, times, teams, venues, scores, and game status. IMPORTANT: STRONGLY recommended to use the team_alias parameter to filter by team - this significantly reduces response size and improves performance. 10-second cache for real-time updates.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nba_season_schedule(
  sdk: ServerSdk,
  params: nba_season_scheduleParams
): Promise<nba_season_scheduleOutput> {
  return await sdk.callTool("nba/1.3.0/nba_season_schedule", params) as nba_season_scheduleOutput;
}

/**
 * The type of the input parameter for nba_game_boxscore tool.
 */
export type nba_game_boxscoreParams = {
  // The unique game ID from Sportradar (obtained from the schedule). Format is typically a UUID.
  game_id: string
}

/**
 * The type of the output of the nba_game_boxscore tool.
 */
export type nba_game_boxscoreOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get detailed game boxscore with player stats, team scores by quarter, leaders, and current game state. Returns comprehensive statistics including shooting percentages, rebounds, assists, turnovers, and more. Real-time updates for live games (10-second cache).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nba_game_boxscore(
  sdk: ServerSdk,
  params: nba_game_boxscoreParams
): Promise<nba_game_boxscoreOutput> {
  return await sdk.callTool("nba/1.3.0/nba_game_boxscore", params) as nba_game_boxscoreOutput;
}

/**
 * The type of the input parameter for nba_season_standings tool.
 */
export type nba_season_standingsParams = {
  // Season type: PRE (Preseason), REG (Regular Season), PST (Postseason), IST (In-Season Tournament), PIT (Play-In Tournament). Defaults to REG.
  season_type?: ('PRE' | 'REG' | 'PST' | 'IST' | 'PIT'),
  // The season year (e.g., 2025, 2024). If not provided, defaults to current year.
  season_year?: number
}

/**
 * The type of the output of the nba_season_standings tool.
 */
export type nba_season_standingsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get NBA season standings organized by conference and division. Returns wins, losses, win percentage, streaks, point differential, and various records (home/road, conference, division, last 10 games). Updated every 2 minutes after game completion.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function nba_season_standings(
  sdk: ServerSdk,
  params: nba_season_standingsParams
): Promise<nba_season_standingsOutput> {
  return await sdk.callTool("nba/1.3.0/nba_season_standings", params) as nba_season_standingsOutput;
}


