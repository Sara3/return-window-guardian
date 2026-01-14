import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "text-to-speech",
   serverVersion: "1.0.1",
   description: "Convert text to speech with multiple voices",
} as const;

/**
 * The type of the input parameter for createMultiVoiceAudio tool.
 */
export type createMultiVoiceAudioParams = {
  // The script to create a multi-voice audio file from. PERFORMANCE TIP: Even if you have a single long script to be read by one voice, segment it into individual chunks (e.g., by paragraph or section). Each chunk can be synthesized in parallel, dramatically speeding up the overall process.
  script: Array<{
    text: string,
    voice: ('female-1' | 'male-1' | 'female-2' | 'male-2' | 'british-female-1' | 'british-male-1')
  }>
}

/**
 * The type of the output of the createMultiVoiceAudio tool.
 */
export type createMultiVoiceAudioOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  audioUrl?: string
}

/**
 * Create a multi-voice audio from a script using the default TTS provider (OpenAI). This is the RECOMMENDED and cost-effective option for most use cases. Produces high-quality audio at low cost, including support for British accents (british-male-1, british-female-1). Use this tool for all TTS needs unless you have a specific requirement that OpenAI cannot fulfill. Returns a cloud storage URL for the generated audio. IMPORTANT: For very long scripts (longer than 1000 words), use createMultiVoiceAudioLongScript instead to avoid timeouts.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createMultiVoiceAudio(
  sdk: ServerSdk,
  params: createMultiVoiceAudioParams
): Promise<createMultiVoiceAudioOutput> {
  return await sdk.callTool("text-to-speech/1.0.1/createMultiVoiceAudio", params) as createMultiVoiceAudioOutput;
}

/**
 * The type of the input parameter for createMultiVoiceAudioLongScript tool.
 */
export type createMultiVoiceAudioLongScriptParams = {
  // The script to create a multi-voice audio file from. TIP: Break long monologues into multiple segments for faster parallel processing.
  script: Array<{
    text: string,
    voice: ('female-1' | 'male-1' | 'female-2' | 'male-2' | 'british-female-1' | 'british-male-1')
  }>
}

/**
 * The type of the output of the createMultiVoiceAudioLongScript tool.
 */
export type createMultiVoiceAudioLongScriptOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  ticketId?: string
}

/**
 * Create a multi-voice audio from a LONG script using OpenAI TTS. This tool is designed for scripts that may take longer than 10 minutes to process and returns a ticket immediately. Use checkMultiVoiceAudioStatus to poll for completion. PERFORMANCE TIP: Even if you have a single long script to be read by one voice, segment it into individual chunks (e.g., by paragraph or section). Each chunk can be synthesized in parallel, dramatically speeding up the overall process. Returns a ticket ID that can be used to check the status.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createMultiVoiceAudioLongScript(
  sdk: ServerSdk,
  params: createMultiVoiceAudioLongScriptParams
): Promise<createMultiVoiceAudioLongScriptOutput> {
  return await sdk.callTool("text-to-speech/1.0.1/createMultiVoiceAudioLongScript", params) as createMultiVoiceAudioLongScriptOutput;
}

/**
 * The type of the input parameter for createElevenLabsMultiVoiceAudio tool.
 */
export type createElevenLabsMultiVoiceAudioParams = {
  // The script to create a multi-voice audio file from. PERFORMANCE TIP: Even if you have a single long script to be read by one voice, segment it into individual chunks (e.g., by paragraph or section). Each chunk can be synthesized in parallel, dramatically speeding up the overall process.
  script: Array<{
    text: string,
    voice: ('female-1' | 'male-1' | 'female-2' | 'male-2' | 'british-female-1' | 'british-male-1' | 'irish-male-1')
  }>
}

/**
 * The type of the output of the createElevenLabsMultiVoiceAudio tool.
 */
export type createElevenLabsMultiVoiceAudioOutput = {
  error?: {
    type: string,
    message: string
  },
  success: boolean,
  audioUrl?: string
}

/**
 * Create a multi-voice audio with ElevenLabs premium voices. WARNING: This is 33x MORE EXPENSIVE than the default createMultiVoiceAudio tool. ONLY use this if you have a specific requirement for ElevenLabs voices or if explicitly requested by the user. For most use cases, including British accents, use createMultiVoiceAudio instead. Returns a cloud storage URL for the generated audio.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createElevenLabsMultiVoiceAudio(
  sdk: ServerSdk,
  params: createElevenLabsMultiVoiceAudioParams
): Promise<createElevenLabsMultiVoiceAudioOutput> {
  return await sdk.callTool("text-to-speech/1.0.1/createElevenLabsMultiVoiceAudio", params) as createElevenLabsMultiVoiceAudioOutput;
}

/**
 * The type of the input parameter for checkMultiVoiceAudioStatus tool.
 */
export type checkMultiVoiceAudioStatusParams = {
  // The ticket ID returned from createMultiVoiceAudioLongScript
  ticketId: string
}

/**
 * The type of the output of the checkMultiVoiceAudioStatus tool.
 */
export type checkMultiVoiceAudioStatusOutput = {
  error?: {
    type: string,
    message: string
  },
  status?: ('pending' | 'processing' | 'completed' | 'failed'),
  success: boolean,
  audioUrl?: string
}

/**
 * Check the status of a long-running TTS job created with createMultiVoiceAudioLongScript. Returns the current status (pending, processing, completed, or failed) and the audio URL if completed. Poll this endpoint periodically until the status is 'completed' or 'failed'.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function checkMultiVoiceAudioStatus(
  sdk: ServerSdk,
  params: checkMultiVoiceAudioStatusParams
): Promise<checkMultiVoiceAudioStatusOutput> {
  return await sdk.callTool("text-to-speech/1.0.1/checkMultiVoiceAudioStatus", params) as checkMultiVoiceAudioStatusOutput;
}


