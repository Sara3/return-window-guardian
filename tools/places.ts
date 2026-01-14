import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "places",
   serverVersion: "1.1.1",
   description: "Get detailed information about nearby places and businesses using the Google Place API",
} as const;

/**
 * The type of the input parameter for searchNearby tool.
 */
export type searchNearbyParams = {
  // Latitude of the center point for the search
  latitude: number,
  // Longitude of the center point for the search
  longitude: number,
  // Search radius in meters (1-50000, default 5000)
  radiusMeters?: number,
  // Types of places to include (up to 50). More types can be added to this list over time as needed.
  includedTypes?: Array<('restaurant' | 'cafe' | 'bar' | 'bakery' | 'store' | 'supermarket' | 'hotel' | 'gas_station' | 'parking' | 'bank' | 'atm' | 'hospital' | 'pharmacy' | 'gym' | 'movie_theater' | 'museum' | 'park')>,
  // Maximum number of results to return (1-20, default 10)
  maxResultCount?: number,
  // How to rank results: DISTANCE or POPULARITY
  rankPreference?: ('DISTANCE' | 'POPULARITY')
}

/**
 * The type of the output of the searchNearby tool.
 */
export type searchNearbyOutput = {
  error?: {
    type: string,
    message: string
  },
  places?: Array<{
    id: string,
    name: string,
    types?: Array<string>,
    rating?: number,
    address: string,
    openNow?: boolean,
    location: {
      latitude: number,
      longitude: number
    },
    priceLevel?: string,
    primaryType?: string,
    primaryPhoto?: {
      name: string,
      widthPx: number,
      heightPx: number,
      photoUrl?: string,
      authorAttributions?: Array<{
        uri?: string,
        photoUri?: string,
        displayName?: string
      }>
    },
    businessStatus?: string,
    userRatingCount?: number
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Search for places near a specific location using Google Places API. Useful for finding restaurants, stores, and other points of interest.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchNearby(
  sdk: ServerSdk,
  params: searchNearbyParams
): Promise<searchNearbyOutput> {
  return await sdk.callTool("places/1.1.1/searchNearby", params) as searchNearbyOutput;
}

/**
 * The type of the input parameter for textSearch tool.
 */
export type textSearchParams = {
  // Only return places that are currently open
  openNow?: boolean,
  // Filter results to places with at least this rating (0-5)
  minRating?: number,
  // The search query text (e.g., 'restaurants in San Francisco')
  textQuery: string,
  // Filter by price levels (array of: 'PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE')
  priceLevels?: Array<string>,
  // Filter results to a specific place type (e.g., 'restaurant', 'cafe', 'bar', 'bakery', 'store', 'supermarket', 'hotel', 'gas_station', 'parking', 'bank', 'atm', 'hospital', 'pharmacy', 'gym', 'movie_theater', 'museum', 'park')
  includedType?: string,
  // Maximum number of results to return (1-20, default 10)
  maxResultCount?: number,
  // How to rank results: 'RELEVANCE' (default) or 'DISTANCE' (requires location restriction)
  rankPreference?: string,
  // Optional latitude for location restriction (results MUST be within this area). Use with restrictLongitude and restrictRadiusMeters.
  restrictLatitude?: number,
  // Optional longitude for location restriction (results MUST be within this area). Use with restrictLatitude and restrictRadiusMeters.
  restrictLongitude?: number,
  // Optional radius in meters for location restriction (1-50000). Results will ONLY include places within this area. Use with restrictLatitude and restrictLongitude.
  restrictRadiusMeters?: number
}

/**
 * The type of the output of the textSearch tool.
 */
export type textSearchOutput = {
  error?: {
    type: string,
    message: string
  },
  places?: Array<{
    id: string,
    name: string,
    types?: Array<string>,
    rating?: number,
    address: string,
    openNow?: boolean,
    location: {
      latitude: number,
      longitude: number
    },
    priceLevel?: string,
    primaryType?: string,
    primaryPhoto?: {
      name: string,
      widthPx: number,
      heightPx: number,
      photoUrl?: string,
      authorAttributions?: Array<{
        uri?: string,
        photoUri?: string,
        displayName?: string
      }>
    },
    businessStatus?: string,
    userRatingCount?: number
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Search for places using a text query (e.g., 'pizza in New York', 'best coffee shops near me'). Returns places ranked by relevance to the query.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function textSearch(
  sdk: ServerSdk,
  params: textSearchParams
): Promise<textSearchOutput> {
  return await sdk.callTool("places/1.1.1/textSearch", params) as textSearchOutput;
}

/**
 * The type of the input parameter for getPlaceDetails tool.
 */
export type getPlaceDetailsParams = {
  // The unique Place ID (e.g., 'ChIJj61dQgK6j4AR4GeTYWZsKWw'). Obtained from textSearch, searchNearby, or other Google Places APIs.
  placeId: string
}

/**
 * The type of the output of the getPlaceDetails tool.
 */
export type getPlaceDetailsOutput = {
  error?: {
    type: string,
    message: string
  },
  places?: Array<{
    id: string,
    name: string,
    types?: Array<string>,
    rating?: number,
    address: string,
    openNow?: boolean,
    location: {
      latitude: number,
      longitude: number
    },
    priceLevel?: string,
    primaryType?: string,
    primaryPhoto?: {
      name: string,
      widthPx: number,
      heightPx: number,
      photoUrl?: string,
      authorAttributions?: Array<{
        uri?: string,
        photoUri?: string,
        displayName?: string
      }>
    },
    businessStatus?: string,
    userRatingCount?: number
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Get detailed information about a specific place using its Place ID. Returns comprehensive details including contact info, hours, photos, reviews, and more.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getPlaceDetails(
  sdk: ServerSdk,
  params: getPlaceDetailsParams
): Promise<getPlaceDetailsOutput> {
  return await sdk.callTool("places/1.1.1/getPlaceDetails", params) as getPlaceDetailsOutput;
}


