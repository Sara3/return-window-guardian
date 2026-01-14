import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "image-generator",
   serverVersion: "1.1.0",
   description: "Generate images with powerful models",
} as const;

/**
 * The type of the input parameter for generateImage tool.
 */
export type generateImageParams = {
  // The prompt to generate an image from. For realistic images, use photography terms. Mention camera angles, lens types, lighting, and fine details to guide the model toward a photorealistic result. To create stickers, icons, or assets, be explicit about the style and request a transparent background.
  prompt: string,
  // The aspect ratio of the generated image. Options: 1:1 (square), 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16 (portrait), 16:9 (landscape), 21:9 (ultra-wide). Defaults to 1:1 if not specified.
  aspectRatio?: ('1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9')
}

/**
 * The type of the output of the generateImage tool.
 */
export type generateImageOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  imageUrl?: string
}

/**
 * Generate an image based on a descriptive prompt, save it to cloud storage and return the URL
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function generateImage(
  sdk: ServerSdk,
  params: generateImageParams
): Promise<generateImageOutput> {
  return await sdk.callTool("image-generator/1.1.0/generateImage", params) as generateImageOutput;
}

/**
 * The type of the input parameter for imagePlusTextToImage tool.
 */
export type imagePlusTextToImageParams = {
  // The text prompt describing how to transform or modify the input image(s). Be specific about the desired changes, style, or modifications.
  prompt: string,
  // The URL(s) of the input image(s) to use as a base for generation. Can be a single URL string or an array of URL strings for multiple images.
  imageUrl: (string | Array<string>),
  // The aspect ratio of the generated image. Options: 1:1 (square), 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16 (portrait), 16:9 (landscape), 21:9 (ultra-wide). Defaults to matching the input image aspect ratio if not specified.
  aspectRatio?: ('1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9')
}

/**
 * The type of the output of the imagePlusTextToImage tool.
 */
export type imagePlusTextToImageOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  imageUrl?: string
}

/**
 * Generate a new image based on one or more input images and a text prompt. This performs image-to-image generation, modifying or transforming the input image(s) according to the text instructions.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function imagePlusTextToImage(
  sdk: ServerSdk,
  params: imagePlusTextToImageParams
): Promise<imagePlusTextToImageOutput> {
  return await sdk.callTool("image-generator/1.1.0/imagePlusTextToImage", params) as imagePlusTextToImageOutput;
}


