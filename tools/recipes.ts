import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "recipes",
   serverVersion: "1.0.0",
   description: "Find high quality recipes from the web",
} as const;

/**
 * The type of the input parameter for recipeSearch tool.
 */
export type recipeSearchParams = {
  // The recipe search query (e.g., 'pumpkin risotto', 'chocolate cake')
  query: string
}

/**
 * The type of the output of the recipeSearch tool.
 */
export type recipeSearchOutput = {
  count?: number,
  error?: {
    type: string,
    message: string
  },
  query?: string,
  recipes?: Array<any>,
  success: boolean,
  fetchedAt: string
}

/**
 * Search for recipes using SerpAPI and extract JSON-LD recipe data from cooking websites
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function recipeSearch(
  sdk: ServerSdk,
  params: recipeSearchParams
): Promise<recipeSearchOutput> {
  return await sdk.callTool("recipes/1.0.0/recipeSearch", params) as recipeSearchOutput;
}

/**
 * The type of the input parameter for parseRecipeFromUrl tool.
 */
export type parseRecipeFromUrlParams = {
  // The URL of the recipe page to parse (e.g., 'https://www.example.com/recipes/chocolate-cake')
  url: string
}

/**
 * The type of the output of the parseRecipeFromUrl tool.
 */
export type parseRecipeFromUrlOutput = {
  url?: string,
  error?: {
    type: string,
    message: string
  },
  recipe?: any,
  success: boolean,
  fetchedAt: string
}

/**
 * Parse JSON-LD recipe data from a specific URL. Use this when you already have a recipe URL and want to extract structured recipe data from it.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function parseRecipeFromUrl(
  sdk: ServerSdk,
  params: parseRecipeFromUrlParams
): Promise<parseRecipeFromUrlOutput> {
  return await sdk.callTool("recipes/1.0.0/parseRecipeFromUrl", params) as parseRecipeFromUrlOutput;
}


