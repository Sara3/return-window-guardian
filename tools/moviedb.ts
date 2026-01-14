import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "moviedb",
   serverVersion: "1.0.0",
   description: "Get information about movies and TV shows",
} as const;

/**
 * The type of the input parameter for searchMovies tool.
 */
export type searchMoviesParams = {
  // Page number for pagination (default: 1)
  page?: number,
  // The movie title to search for
  query: string,
  // Language for results (default: en-US)
  language?: string,
  // Include adult content (default: false)
  include_adult?: boolean
}

/**
 * The type of the output of the searchMovies tool.
 */
export type searchMoviesOutput = {
  page: number,
  error?: {
    type: string,
    message: string
  },
  results: Array<{
    id: number,
    adult: boolean,
    title: string,
    video: boolean,
    overview: string,
    genre_ids: Array<number>,
    popularity: number,
    poster_url?: string,
    vote_count: number,
    poster_path: (string | null),
    backdrop_url?: string,
    release_date: string,
    vote_average: number,
    backdrop_path: (string | null),
    original_title: string,
    original_language: string
  }>,
  success: boolean,
  total_pages: number,
  total_results: number
}

/**
 * Search for movies by title using The Movie Database API
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchMovies(
  sdk: ServerSdk,
  params: searchMoviesParams
): Promise<searchMoviesOutput> {
  return await sdk.callTool("moviedb/1.0.0/searchMovies", params) as searchMoviesOutput;
}

/**
 * The type of the input parameter for searchTVShows tool.
 */
export type searchTVShowsParams = {
  // Page number for pagination (default: 1)
  page?: number,
  // The TV show title to search for
  query: string,
  // Language for results (default: en-US)
  language?: string,
  // Include adult content (default: false)
  include_adult?: boolean
}

/**
 * The type of the output of the searchTVShows tool.
 */
export type searchTVShowsOutput = {
  page: number,
  error?: {
    type: string,
    message: string
  },
  results: Array<{
    id: number,
    name: string,
    adult: boolean,
    overview: string,
    genre_ids: Array<number>,
    popularity: number,
    poster_url?: string,
    vote_count: number,
    poster_path: (string | null),
    backdrop_url?: string,
    vote_average: number,
    backdrop_path: (string | null),
    original_name: string,
    first_air_date: string,
    origin_country: Array<string>,
    original_language: string
  }>,
  success: boolean,
  total_pages: number,
  total_results: number
}

/**
 * Search for TV shows by title using The Movie Database API
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchTVShows(
  sdk: ServerSdk,
  params: searchTVShowsParams
): Promise<searchTVShowsOutput> {
  return await sdk.callTool("moviedb/1.0.0/searchTVShows", params) as searchTVShowsOutput;
}

/**
 * The type of the input parameter for getPopularMovies tool.
 */
export type getPopularMoviesParams = {
  // Page number for pagination (default: 1)
  page?: number,
  // Language for results (default: en-US)
  language?: string,
  // Include adult content (default: false)
  include_adult?: boolean
}

/**
 * The type of the output of the getPopularMovies tool.
 */
export type getPopularMoviesOutput = {
  page: number,
  error?: {
    type: string,
    message: string
  },
  results: Array<{
    id: number,
    adult: boolean,
    title: string,
    video: boolean,
    overview: string,
    genre_ids: Array<number>,
    popularity: number,
    poster_url?: string,
    vote_count: number,
    poster_path: (string | null),
    backdrop_url?: string,
    release_date: string,
    vote_average: number,
    backdrop_path: (string | null),
    original_title: string,
    original_language: string
  }>,
  success: boolean,
  total_pages: number,
  total_results: number
}

/**
 * Get popular movies using The Movie Database API
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getPopularMovies(
  sdk: ServerSdk,
  params: getPopularMoviesParams
): Promise<getPopularMoviesOutput> {
  return await sdk.callTool("moviedb/1.0.0/getPopularMovies", params) as getPopularMoviesOutput;
}

/**
 * The type of the input parameter for getPopularTVShows tool.
 */
export type getPopularTVShowsParams = {
  // Page number for pagination (default: 1)
  page?: number,
  // Language for results (default: en-US)
  language?: string,
  // Include adult content (default: false)
  include_adult?: boolean
}

/**
 * The type of the output of the getPopularTVShows tool.
 */
export type getPopularTVShowsOutput = {
  page: number,
  error?: {
    type: string,
    message: string
  },
  results: Array<{
    id: number,
    name: string,
    adult: boolean,
    overview: string,
    genre_ids: Array<number>,
    popularity: number,
    poster_url?: string,
    vote_count: number,
    poster_path: (string | null),
    backdrop_url?: string,
    vote_average: number,
    backdrop_path: (string | null),
    original_name: string,
    first_air_date: string,
    origin_country: Array<string>,
    original_language: string
  }>,
  success: boolean,
  total_pages: number,
  total_results: number
}

/**
 * Get popular TV shows using The Movie Database API
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getPopularTVShows(
  sdk: ServerSdk,
  params: getPopularTVShowsParams
): Promise<getPopularTVShowsOutput> {
  return await sdk.callTool("moviedb/1.0.0/getPopularTVShows", params) as getPopularTVShowsOutput;
}


