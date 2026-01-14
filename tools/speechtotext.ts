import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "speechtotext",
   serverVersion: "1.0.0",
   description: "Transcribe spoken audio files to text",
} as const;

/**
 * The type of the input parameter for transcribeAudio tool.
 */
export type transcribeAudioParams = {
  // The URL of the audio file to transcribe. Must be a publicly accessible URL or a pre-signed URL.
  audioUrl: string
}

/**
 * The type of the output of the transcribeAudio tool.
 */
export type transcribeAudioOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  transcription?: string
}

/**
 * Transcribe audio from a URL. The audio file must be under 25MB and accessible via URL. Returns the transcribed text.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function transcribeAudio(
  sdk: ServerSdk,
  params: transcribeAudioParams
): Promise<transcribeAudioOutput> {
  return await sdk.callTool("speechtotext/1.0.0/transcribeAudio", params) as transcribeAudioOutput;
}


