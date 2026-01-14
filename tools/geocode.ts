import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "geocode",
   serverVersion: "1.1.0",
   description: "Get geocoding information about any address from the Google Maps Platform.",
} as const;

/**
 * The type of the input parameter for geocodeAddress tool.
 */
export type geocodeAddressParams = {
  // Region code for biasing results (e.g., 'us', 'uk')
  region?: string,
  // The address to geocode (e.g., '1600 Amphitheatre Parkway, Mountain View, CA')
  address: string,
  // Language code for results (e.g., 'en', 'es')
  language?: string
}

/**
 * The type of the output of the geocodeAddress tool.
 */
export type geocodeAddressOutput = {
  error?: {
    type: string,
    message: string
  },
  results?: Array<{
    types: Array<string>,
    placeId: string,
    location: {
      latitude: number,
      longitude: number
    },
    locationType: string,
    formattedAddress: string
  }>,
  success: boolean,
  fetchedAt: string
}

/**
 * Convert an address string to geographic coordinates (latitude/longitude) using Google Geocoding API
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function geocodeAddress(
  sdk: ServerSdk,
  params: geocodeAddressParams
): Promise<geocodeAddressOutput> {
  return await sdk.callTool("geocode/1.1.0/geocodeAddress", params) as geocodeAddressOutput;
}

/**
 * The type of the input parameter for latLngToPlusCode tool.
 */
export type latLngToPlusCodeParams = {
  // Latitude coordinate
  lat: number,
  // Longitude coordinate
  lng: number,
  // Desired Plus Code length (default: 10). Longer codes are more precise. Standard length is 10 (~14m x 14m area).
  length?: number
}

/**
 * The type of the output of the latLngToPlusCode tool.
 */
export type latLngToPlusCodeOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  plusCode?: {
    bounds: {
      northeast: {
        lat: number,
        lng: number
      },
      southwest: {
        lat: number,
        lng: number
      }
    },
    center: {
      lat: number,
      lng: number
    },
    fullCode: string,
    compoundCode?: string
  },
  fetchedAt: string
}

/**
 * Convert geographic coordinates (latitude/longitude) to a Google Plus Code. Returns the full Plus Code with area bounds and center point.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function latLngToPlusCode(
  sdk: ServerSdk,
  params: latLngToPlusCodeParams
): Promise<latLngToPlusCodeOutput> {
  return await sdk.callTool("geocode/1.1.0/latLngToPlusCode", params) as latLngToPlusCodeOutput;
}


