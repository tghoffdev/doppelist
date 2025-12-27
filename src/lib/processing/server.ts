import type { OutputFormat } from "@/types";

/**
 * Server-side Video Processing Client
 *
 * Uploads video to server for faster FFmpeg processing.
 *
 * TODO: Phase 3 implementation
 * - Upload blob to /api/process
 * - Handle progress and streaming response
 * - Fallback to client-side if server fails
 */

export interface ServerProcessingOptions {
  cropWidth: number;
  cropHeight: number;
  outputFormat: OutputFormat;
  onProgress?: (progress: number) => void;
}

/**
 * Uploads and processes video on the server
 */
export async function processVideoOnServer(
  inputBlob: Blob,
  options: ServerProcessingOptions
): Promise<Blob> {
  // Placeholder
  throw new Error("Server-side processing not yet implemented");
}
