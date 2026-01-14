import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "transitland",
   serverVersion: "1.4.0",
   description: "Agency, stops & departure information for local transit.",
} as const;

/**
 * The type of the input parameter for find_agencies_near_location tool.
 */
export type find_agencies_near_locationParams = {
  // Latitude of the search location. Either provide lat/lon OR address (not both).
  lat?: number,
  // Longitude of the search location. Either provide lat/lon OR address (not both).
  lon?: number,
  // Maximum results (default: 50)
  limit?: number,
  // Search radius in meters (default: 10000, max: 100000)
  radius?: number,
  // Address to search near (e.g., '1600 Amphitheatre Parkway, Mountain View, CA'). Will be geocoded to coordinates. Either provide address OR lat/lon (not both).
  address?: string,
  // Filter results to agencies matching this name (case-insensitive partial match). Example: 'Caltrain' or 'BART'.
  agency_name?: string
}

/**
 * The type of the output of the find_agencies_near_location tool.
 */
export type find_agencies_near_locationOutput = {
  count?: number,
  error?: string,
  success: boolean,
  fetchedAt: string,
  operators?: Array<{
    name: string,
    feeds?: Array<any>,
    website?: (string | null),
    agencies?: Array<any>,
    timezone?: (string | null),
    onestop_id: string,
    short_name?: (string | null)
  }>
}

/**
 * Find transit agencies/operators near a geographic location or address. Use this FIRST to discover which transit agencies serve an area (e.g., 'BART', 'Caltrain', 'Muni'), then use those exact agency names with search_stops_near_location or get_departures_from_stop to find stops/departures operated by specific agencies. Returns the official transit operators, not bus stops or facilities named after them. You can provide either lat/lon coordinates OR an address (which will be geocoded).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function find_agencies_near_location(
  sdk: ServerSdk,
  params: find_agencies_near_locationParams
): Promise<find_agencies_near_locationOutput> {
  return await sdk.callTool("transitland/1.4.0/find_agencies_near_location", params) as find_agencies_near_locationOutput;
}

/**
 * The type of the input parameter for search_stops_near_location tool.
 */
export type search_stops_near_locationParams = {
  // Latitude of the search location. Either provide lat/lon OR address (not both).
  lat?: number,
  // Longitude of the search location. Either provide lat/lon OR address (not both).
  lon?: number,
  // Maximum results (default: 100)
  limit?: number,
  // Search radius in meters. CRITICAL: For 'closest' or 'nearby' stops, use 1000-2000m. DO NOT USE 10000+ - API returns random stops within radius, NOT sorted by distance. Using large radius (>5000m) will return distant random stops, not the closest ones. Values >5000m are auto-corrected to 5000m. Default: 2000m.
  radius?: number,
  // Search for stops by name or ID. Performs a text search on stop names and stop IDs. Example: 'Market' to find stops with 'Market' in their name.
  search?: string,
  // Address to search near (e.g., '1600 Amphitheatre Parkway, Mountain View, CA'). Will be geocoded to coordinates. Either provide address OR lat/lon (not both).
  address?: string,
  // STRONGLY RECOMMENDED: Filter by transit mode. Common values: 2=Rail/Train (Caltrain, Amtrak), 1=Subway/Metro (BART, Muni Metro), 0=Tram/Light Rail, 3=Bus, 4=Ferry. Use this to find specific types of transit.
  route_type?: Array<number>,
  // IMPORTANT: Filter to ONLY stops actually operated/served by this transit agency. Returns stops where the agency runs service, NOT stops that merely mention the agency name. Examples: 'BART' returns only BART subway stations (not bus stops near BART), 'Caltrain' returns only Caltrain train stations, 'Muni' returns only Muni-operated stops. This performs server-side filtering by agency operator.
  agency_name?: string
}

/**
 * The type of the output of the search_stops_near_location tool.
 */
export type search_stops_near_locationOutput = {
  count?: number,
  error?: string,
  stops?: Array<{
    stop_id?: (string | null),
    geometry?: {
      type: string,
      coordinates: Array<number>
    },
    stop_name?: (string | null),
    onestop_id: string,
    route_stops?: Array<{
      route?: {
        route_id?: (string | null),
        route_type?: (number | null),
        route_color?: (string | null),
        route_long_name?: (string | null),
        route_short_name?: (string | null)
      }
    }>,
    location_type?: (number | null)
  }>,
  success: boolean,
  warning?: string,
  fetchedAt: string
}

/**
 * Search for transit stops near a geographic location or address. When agency_name is specified, returns ONLY stops actually operated by that transit agency - NOT stops that merely mention the agency in their name. For example, 'agency_name: BART' returns BART subway stations (operated by BART), but excludes bus stops named 'Embarcadero BART Drop Off' (operated by bus companies). Always use agency_name parameter when searching for a specific transit operator's stops. You can provide either lat/lon coordinates OR an address (which will be geocoded).  IMPORTANT: For finding 'closest' or 'nearby' stops, use radius: 1000-2000 (meters). DO NOT use large radius values - the API does NOT sort results by distance, so a large radius returns random distant stops instead of the closest ones. Maximum radius is 5000m.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function search_stops_near_location(
  sdk: ServerSdk,
  params: search_stops_near_locationParams
): Promise<search_stops_near_locationOutput> {
  return await sdk.callTool("transitland/1.4.0/search_stops_near_location", params) as search_stops_near_locationOutput;
}

/**
 * The type of the input parameter for get_departures_from_stop tool.
 */
export type get_departures_from_stopParams = {
  // Specific date in YYYY-MM-DD format (e.g., '2025-10-26'). Without 'next' parameter, returns departures starting from midnight (00:00:00) on this date.
  date?: string,
  // Seconds into the future to search (default: 3600 = 1 hour). Defines the time window duration. With relative_date/date, window starts at current time on that date. Without date parameters, starts from now.
  next?: number,
  // Maximum results (default: 100)
  limit?: number,
  // The Onestop ID of the stop (e.g., 's-9q8yyugptw-16st~mission'). Get this from search_stops_near_location.
  stop_id: string,
  // Filter by GTFS route type: 2=Rail/Train, 1=Subway/Metro, 0=Tram/Light Rail, 3=Bus, 4=Ferry. Useful for multimodal stations.
  route_type?: number,
  // Filter departures to agencies matching this name (case-insensitive partial match). Example: 'Caltrain', 'BART', 'Muni'.
  agency_name?: string,
  // Relative date: 'TODAY', 'NEXT_MONDAY', 'NEXT_TUESDAY', etc. When used with 'next', the time window starts at the current wall-clock time on that date. Without 'next', returns departures from midnight onwards.
  relative_date?: string
}

/**
 * The type of the output of the get_departures_from_stop tool.
 */
export type get_departures_from_stopOutput = {
  stop?: {
    stop_name?: string,
    onestop_id?: string
  },
  count?: number,
  error?: string,
  success: boolean,
  fetchedAt: string,
  departures?: Array<{
    trip?: {
      route?: {
        agency?: {
          agency_id?: (string | null),
          agency_name?: (string | null)
        },
        route_id?: (string | null),
        route_type?: (number | null),
        route_color?: (string | null),
        route_long_name?: (string | null),
        route_short_name?: (string | null)
      },
      trip_id?: (string | null),
      trip_headsign?: (string | null)
    },
    arrival_time?: (string | null),
    service_date?: (string | null),
    stop_headsign?: (string | null),
    departure_time?: (string | null),
    continuous_pickup?: (number | null),
    continuous_drop_off?: (number | null)
  }>
}

/**
 * Get upcoming departures from a specific transit stop. Shows when buses, trains, etc. will arrive/depart from the stop. Can filter by agency name for user-friendly filtering.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_departures_from_stop(
  sdk: ServerSdk,
  params: get_departures_from_stopParams
): Promise<get_departures_from_stopOutput> {
  return await sdk.callTool("transitland/1.4.0/get_departures_from_stop", params) as get_departures_from_stopOutput;
}


