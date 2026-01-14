import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "soccer",
   serverVersion: "1.2.0",
   description: "Global soccer data and live scores",
} as const;

/**
 * The type of the input parameter for soccer_competitions tool.
 */
export type soccer_competitionsParams = {
  // Optional filter to search for competitions by name (e.g., 'Premier', 'Champions', 'Liga'). Case-insensitive partial matching.
  name_filter?: string
}

/**
 * The type of the output of the soccer_competitions tool.
 */
export type soccer_competitionsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get list of all available soccer competitions worldwide with their IDs, names, and categories. Use this to find competition IDs for other tools. Returns competitions organized by country/category.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_competitions(
  sdk: ServerSdk,
  params: soccer_competitionsParams
): Promise<soccer_competitionsOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_competitions", params) as soccer_competitionsOutput;
}

/**
 * The type of the input parameter for soccer_season_standings tool.
 */
export type soccer_season_standingsParams = {
  // The unique season ID from Sportradar (e.g., 'sr:season:118689' for Premier League 24/25). Use soccer_season_info tool to find season IDs for a competition.
  season_id: string
}

/**
 * The type of the output of the soccer_season_standings tool.
 */
export type soccer_season_standingsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get current standings for a soccer league/competition. Returns team rankings, points, wins, losses, draws, goals for/against, and performance metrics (home/away splits). Top competitions: UEFA Champions League (sr:competition:7), Premier League (sr:competition:17), LaLiga (sr:competition:8), Serie A (sr:competition:23), Bundesliga (sr:competition:35), Ligue 1 (sr:competition:34).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_season_standings(
  sdk: ServerSdk,
  params: soccer_season_standingsParams
): Promise<soccer_season_standingsOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_season_standings", params) as soccer_season_standingsOutput;
}

/**
 * The type of the input parameter for soccer_daily_matches tool.
 */
export type soccer_daily_matchesParams = {
  // Date in YYYY-MM-DD format (e.g., '2025-10-08'). Use today's date for live scores.
  date: string,
  // The competition ID to filter matches (e.g., 'sr:competition:17' for Premier League). Required to keep results manageable.
  competition_id: string
}

/**
 * The type of the output of the soccer_daily_matches tool.
 */
export type soccer_daily_matchesOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get soccer matches for a specific date with live scores, filtered by competition. Returns match summaries with teams, scores, status (scheduled/live/ended), start times, and statistics. IMPORTANT: Must specify competition_id to filter results (without filtering, returns 100+ matches worldwide). Use for live scores and match tracking. Top competitions: UEFA Champions League (sr:competition:7), Premier League (sr:competition:17), LaLiga (sr:competition:8), Serie A (sr:competition:23), Bundesliga (sr:competition:35), Ligue 1 (sr:competition:34).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_daily_matches(
  sdk: ServerSdk,
  params: soccer_daily_matchesParams
): Promise<soccer_daily_matchesOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_daily_matches", params) as soccer_daily_matchesOutput;
}

/**
 * The type of the input parameter for soccer_season_info tool.
 */
export type soccer_season_infoParams = {
  // The competition ID (e.g., 'sr:competition:17' for Premier League). Use soccer_competitions tool to find competition IDs.
  competition_id: string
}

/**
 * The type of the output of the soccer_season_info tool.
 */
export type soccer_season_infoOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get season information (including season IDs) for a specific competition. Returns list of seasons with IDs, names, start/end dates, and years. Use this to find season_id values needed for other tools like standings. Top competitions: UEFA Champions League (sr:competition:7), Premier League (sr:competition:17), LaLiga (sr:competition:8), Serie A (sr:competition:23), Bundesliga (sr:competition:35), Ligue 1 (sr:competition:34).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_season_info(
  sdk: ServerSdk,
  params: soccer_season_infoParams
): Promise<soccer_season_infoOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_season_info", params) as soccer_season_infoOutput;
}

/**
 * The type of the input parameter for soccer_season_schedule tool.
 */
export type soccer_season_scheduleParams = {
  // Optional: Team/competitor ID to filter results. If not provided, returns full schedule. Popular teams: Manchester United (sr:competitor:35), Manchester City (sr:competitor:17), Arsenal (sr:competitor:42), Chelsea (sr:competitor:38), Liverpool (sr:competitor:44), Real Madrid (sr:competitor:2829), Barcelona (sr:competitor:2817).
  team_id?: string,
  // The unique season ID from Sportradar (e.g., 'sr:season:118689' for Premier League 24/25). Use soccer_season_info tool to find season IDs.
  season_id: string
}

/**
 * The type of the output of the soccer_season_schedule tool.
 */
export type soccer_season_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get full season schedule for a competition. Returns all matches with IDs, dates, teams, scores, and status. Can optionally filter by team_id to reduce response size. IMPORTANT: For team-specific queries, STRONGLY prefer using soccer_team_schedule tool instead - it is more efficient and includes past 30 matches plus all upcoming matches.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_season_schedule(
  sdk: ServerSdk,
  params: soccer_season_scheduleParams
): Promise<soccer_season_scheduleOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_season_schedule", params) as soccer_season_scheduleOutput;
}

/**
 * The type of the input parameter for soccer_team_schedule tool.
 */
export type soccer_team_scheduleParams = {
  // The unique team/competitor ID from Sportradar (e.g., 'sr:competitor:39' for Newcastle United). Can be found in match data from other tools or by searching competitions.
  team_id: string
}

/**
 * The type of the output of the soccer_team_schedule tool.
 */
export type soccer_team_scheduleOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get match schedule for a specific team including past 30 matches and all upcoming matches. Perfect for answering questions like 'who did Newcastle play last?' or 'when is Liverpool's next match?'. Returns filtered match information including dates, opponents, scores, and competition. More efficient than season schedule when you only need one team's data.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_team_schedule(
  sdk: ServerSdk,
  params: soccer_team_scheduleParams
): Promise<soccer_team_scheduleOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_team_schedule", params) as soccer_team_scheduleOutput;
}

/**
 * The type of the input parameter for soccer_match_summary tool.
 */
export type soccer_match_summaryParams = {
  // The unique match/sport event ID from Sportradar (e.g., 'sr:sport_event:50849967'). Can be obtained from schedule, daily matches, or team schedule tools.
  match_id: string
}

/**
 * The type of the output of the soccer_match_summary tool.
 */
export type soccer_match_summaryOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get detailed match summary including goal scorers, assists, team statistics, and play-by-play information. Perfect for answering 'who scored the goals?' or getting detailed match stats. Returns comprehensive match data with real-time updates (1-second cache for live matches).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_match_summary(
  sdk: ServerSdk,
  params: soccer_match_summaryParams
): Promise<soccer_match_summaryOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_match_summary", params) as soccer_match_summaryOutput;
}

/**
 * The type of the input parameter for soccer_match_fun_facts tool.
 */
export type soccer_match_fun_factsParams = {
  // The unique match/sport event ID from Sportradar (e.g., 'sr:sport_event:50849967'). Can be obtained from schedule, daily matches, or team schedule tools.
  match_id: string
}

/**
 * The type of the output of the soccer_match_fun_facts tool.
 */
export type soccer_match_fun_factsOutput = {
  data?: any,
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  fetchedAt: string
}

/**
 * Get interesting, human-readable fun facts about a match based on statistical information. Includes historical results, team performance trends, and noteworthy statistics (e.g., 'The most common result when these teams meet is 2-1' or 'Team X has scored in 10 consecutive matches'). Great for adding context to match discussions.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function soccer_match_fun_facts(
  sdk: ServerSdk,
  params: soccer_match_fun_factsParams
): Promise<soccer_match_fun_factsOutput> {
  return await sdk.callTool("soccer/1.2.0/soccer_match_fun_facts", params) as soccer_match_fun_factsOutput;
}


