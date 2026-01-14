import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "webcrawl",
   serverVersion: "1.0.7",
   description: "Enables your sidekick to read any web page",
} as const;

/**
 * The type of the input parameter for crawlUrl tool.
 */
export type crawlUrlParams = {
  // The URL to crawl and extract content from
  url: string
}

/**
 * The type of the output of the crawlUrl tool.
 */
export type crawlUrlOutput = {
  url?: string,
  error?: {
    type: string,
    message: string
  },
  title?: string,
  byline?: string,
  success: boolean,
  fetchedAt?: string,
  openGraph?: {
    url?: string,
    type?: string,
    audio?: string,
    image?: string,
    title?: string,
    video?: string,
    locale?: string,
    imageAlt?: string,
    siteName?: string,
    imageWidth?: string,
    description?: string,
    imageHeight?: string
  },
  textLength?: number,
  readableHtml?: string
}

/**
 * Fetch a web page and extract the main article content using Readability.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function crawlUrl(
  sdk: ServerSdk,
  params: crawlUrlParams
): Promise<crawlUrlOutput> {
  return await sdk.callTool("webcrawl/1.0.7/crawlUrl", params) as crawlUrlOutput;
}

/**
 * The type of the input parameter for crawlUrlRaw tool.
 */
export type crawlUrlRawParams = {
  // The URL to fetch raw HTML from
  url: string
}

/**
 * The type of the output of the crawlUrlRaw tool.
 */
export type crawlUrlRawOutput = {
  url?: string,
  error?: {
    type: string,
    message: string
  },
  rawHtml?: string,
  success: boolean,
  fetchedAt?: string,
  contentLength?: number
}

/**
 * Fetch a web page and return the raw HTML content without any processing. Unlike crawlUrl, this tool does NOT extract readable content using Readability - it returns the complete, unprocessed HTML as received from the server. Use this when you need the full page structure, scripts, styles, or when Readability extraction is not desired.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function crawlUrlRaw(
  sdk: ServerSdk,
  params: crawlUrlRawParams
): Promise<crawlUrlRawOutput> {
  return await sdk.callTool("webcrawl/1.0.7/crawlUrlRaw", params) as crawlUrlRawOutput;
}

/**
 * The type of the input parameter for renderUrlGrabContent tool.
 */
export type renderUrlGrabContentParams = {
  // The URL to render with a browser and extract content from
  url: string
}

/**
 * The type of the output of the renderUrlGrabContent tool.
 */
export type renderUrlGrabContentOutput = {
  url?: string,
  error?: {
    type: string,
    message: string
  },
  title?: string,
  byline?: string,
  success: boolean,
  fetchedAt?: string,
  openGraph?: {
    url?: string,
    type?: string,
    audio?: string,
    image?: string,
    title?: string,
    video?: string,
    locale?: string,
    imageAlt?: string,
    siteName?: string,
    imageWidth?: string,
    description?: string,
    imageHeight?: string
  },
  textLength?: number,
  readableHtml?: string
}

/**
 * Render a web page using a headless browser (browserless.io) and extract the main article content using Readability. This tool ALWAYS uses a full Chrome browser to render JavaScript, handle dynamic content, and bypass bot detection. It then extracts readable content. Use this for JavaScript-heavy sites, sites with bot protection, or when you need guaranteed browser rendering with clean article extraction. This tool costs $0.012 per request.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function renderUrlGrabContent(
  sdk: ServerSdk,
  params: renderUrlGrabContentParams
): Promise<renderUrlGrabContentOutput> {
  return await sdk.callTool("webcrawl/1.0.7/renderUrlGrabContent", params) as renderUrlGrabContentOutput;
}

/**
 * The type of the input parameter for renderUrlGrabAllContent tool.
 */
export type renderUrlGrabAllContentParams = {
  // The URL to render with a browser and return complete HTML from
  url: string
}

/**
 * The type of the output of the renderUrlGrabAllContent tool.
 */
export type renderUrlGrabAllContentOutput = {
  url?: string,
  error?: {
    type: string,
    message: string
  },
  rawHtml?: string,
  success: boolean,
  fetchedAt?: string,
  contentLength?: number
}

/**
 * Render a web page using a headless browser (browserless.io) and return the complete raw HTML without any processing. This tool ALWAYS uses a full Chrome browser to render JavaScript, handle dynamic content, and bypass bot detection. Unlike renderUrlGrabContent, it does NOT run Readability - it returns the full rendered HTML including all scripts, styles, and page structure. Use this for JavaScript-heavy sites where you need the complete rendered page structure. This tool costs $0.012 per request.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function renderUrlGrabAllContent(
  sdk: ServerSdk,
  params: renderUrlGrabAllContentParams
): Promise<renderUrlGrabAllContentOutput> {
  return await sdk.callTool("webcrawl/1.0.7/renderUrlGrabAllContent", params) as renderUrlGrabAllContentOutput;
}


