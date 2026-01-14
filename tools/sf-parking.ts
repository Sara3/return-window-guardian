import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "sf-parking",
   serverVersion: "1.16.0",
   description: "Provides access to San Francisco's dynamic pricing for street parking.",
} as const;

/**
 * The type of the input parameter for get_parking_by_bbox tool.
 */
export type get_parking_by_bboxParams = {
  max_lat: number,
  max_lon: number,
  min_lat: number,
  min_lon: number,
  max_records?: number
}

/**
 * The type of the output of the get_parking_by_bbox tool.
 */
export type get_parking_by_bboxOutput = {
  result: string
}

/**
 * Get parking blockface data within a bounding box (lat/lon coordinates).  Returns street parking availability, rates, and location information for SF parking zones.  Args:     min_lat: Minimum latitude (south boundary)     min_lon: Minimum longitude (west boundary)     max_lat: Maximum latitude (north boundary)     max_lon: Maximum longitude (east boundary)     max_records: Maximum number of records to return (default: 100, max: 1000)  Returns:     JSON string with parking data
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_parking_by_bbox(
  sdk: ServerSdk,
  params: get_parking_by_bboxParams
): Promise<get_parking_by_bboxOutput> {
  return await sdk.callTool("sf-parking/1.16.0/get_parking_by_bbox", params) as get_parking_by_bboxOutput;
}

/**
 * The type of the input parameter for get_parking_by_street tool.
 */
export type get_parking_by_streetParams = {
  max_records?: number,
  street_name: string
}

/**
 * The type of the output of the get_parking_by_street tool.
 */
export type get_parking_by_streetOutput = {
  result: string
}

/**
 * Search for parking blockface data by street name.  Returns availability, rates, and location information for matching streets in San Francisco.  Args:     street_name: Street name to search for (e.g., 'Market', 'Mission')     max_records: Maximum number of records to return (default: 50, max: 1000)  Returns:     JSON string with parking data
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_parking_by_street(
  sdk: ServerSdk,
  params: get_parking_by_streetParams
): Promise<get_parking_by_streetOutput> {
  return await sdk.callTool("sf-parking/1.16.0/get_parking_by_street", params) as get_parking_by_streetOutput;
}

/**
 * The type of the input parameter for get_parking_by_location tool.
 */
export type get_parking_by_locationParams = {
  latitude: number,
  longitude: number,
  max_records?: number
}

/**
 * The type of the output of the get_parking_by_location tool.
 */
export type get_parking_by_locationOutput = {
  result: string
}

/**
 * Get parking blockface data near a specific point (lat/lon).  Searches within approximately 200 meters of the given coordinates.  Args:     latitude: Latitude of the location     longitude: Longitude of the location     max_records: Maximum number of records to return (default: 20, max: 1000)  Returns:     JSON string with parking data
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_parking_by_location(
  sdk: ServerSdk,
  params: get_parking_by_locationParams
): Promise<get_parking_by_locationOutput> {
  return await sdk.callTool("sf-parking/1.16.0/get_parking_by_location", params) as get_parking_by_locationOutput;
}


