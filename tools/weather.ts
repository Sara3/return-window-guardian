import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "weather",
   serverVersion: "1.1.0",
   description: "Provides real-time and forecast weather information, marine forecast, and tides.",
} as const;

/**
 * The type of the input parameter for getCurrentWeather tool.
 */
export type getCurrentWeatherParams = {
  // The location to get weather for (can be city name, coordinates, etc.)
  location: string
}

/**
 * The type of the output of the getCurrentWeather tool.
 */
export type getCurrentWeatherOutput = {
  data?: {
    uv?: number,
    pollen?: {
      oak?: number,
      alder?: number,
      birch?: number,
      grass?: number,
      hazel?: number,
      mugwort?: number,
      ragweed?: number
    },
    humidity?: number,
    wind_kph?: number,
    wind_mph?: number,
    condition?: string,
    localTime?: string,
    air_quality?: {
      co?: number,
      o3?: number,
      no2?: number,
      so2?: number,
      pm10?: number,
      pm2_5?: number,
      us_epa_index?: number,
      gb_defra_index?: number
    },
    feelslike_c?: number,
    feelslike_f?: number,
    temperature_c?: number,
    temperature_f?: number
  },
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  location?: string,
  fetchedAt: string
}

/**
 * Get current weather, air quality, and pollen data for a given location using WeatherAPI.com. Includes temperature, conditions, wind, humidity, UV index, air quality data (CO, NO2, O3, SO2, PM2.5, PM10, and air quality indices), and pollen levels (hazel, alder, birch, oak, grass, mugwort, and ragweed).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getCurrentWeather(
  sdk: ServerSdk,
  params: getCurrentWeatherParams
): Promise<getCurrentWeatherOutput> {
  return await sdk.callTool("weather/1.1.0/getCurrentWeather", params) as getCurrentWeatherOutput;
}

/**
 * The type of the input parameter for getWeatherForecast tool.
 */
export type getWeatherForecastParams = {
  // Number of days to forecast (1-7) starting from today. Default is 7 days. Make sure the day you care about is included.
  days?: number,
  // The location to get forecast for (can be city name, coordinates, etc.)
  location: string
}

/**
 * The type of the output of the getWeatherForecast tool.
 */
export type getWeatherForecastOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  forecast?: any,
  location?: string,
  fetchedAt: string
}

/**
 * Get a 1-7 day weather forecast with air quality and pollen data for a given location using WeatherAPI.com. Includes current conditions, daily forecasts with temperature ranges, conditions, air quality metrics (CO, NO2, O3, SO2, PM2.5, PM10, and air quality indices), and pollen levels (hazel, alder, birch, oak, grass, mugwort, and ragweed).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getWeatherForecast(
  sdk: ServerSdk,
  params: getWeatherForecastParams
): Promise<getWeatherForecastOutput> {
  return await sdk.callTool("weather/1.1.0/getWeatherForecast", params) as getWeatherForecastOutput;
}

/**
 * The type of the input parameter for getMarineConditions tool.
 */
export type getMarineConditionsParams = {
  // Number of days to forecast (1-7)
  days?: number,
  // The coastal location to get marine conditions for (can be city name, coordinates, etc.)
  location: string
}

/**
 * The type of the output of the getMarineConditions tool.
 */
export type getMarineConditionsOutput = {
  error?: {
    type: string,
    message: string
  },
  marine?: any,
  success: boolean,
  location?: string,
  fetchedAt: string
}

/**
 * Get marine weather conditions and forecast including tides, wave heights, swell, and water temperature for coastal locations using WeatherAPI.com
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getMarineConditions(
  sdk: ServerSdk,
  params: getMarineConditionsParams
): Promise<getMarineConditionsOutput> {
  return await sdk.callTool("weather/1.1.0/getMarineConditions", params) as getMarineConditionsOutput;
}

/**
 * The type of the input parameter for getWeatherAlerts tool.
 */
export type getWeatherAlertsParams = {
  // The location to get alerts for (can be city name, coordinates, etc.)
  location: string
}

/**
 * The type of the output of the getWeatherAlerts tool.
 */
export type getWeatherAlertsOutput = {
  error?: {
    type: string,
    message: string
  },
  alerts?: any,
  success: boolean,
  location?: string,
  fetchedAt: string
}

/**
 * Get active weather alerts for a given location using WeatherAPI.com. Returns severe weather warnings, watches, and advisories including severity, urgency, event type, affected areas, and instructions.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getWeatherAlerts(
  sdk: ServerSdk,
  params: getWeatherAlertsParams
): Promise<getWeatherAlertsOutput> {
  return await sdk.callTool("weather/1.1.0/getWeatherAlerts", params) as getWeatherAlertsOutput;
}


