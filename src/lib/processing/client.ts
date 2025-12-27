import type { OutputFormat } from "@/types";

/**
 * Client-side Video Processing
 *
 * Uses FFmpeg WASM for browser-based video processing.
 * Ported from Celtra Recorder Svelte implementation.
 *
 * TODO: Phase 1 implementation
 * - FFmpeg WASM loading
 * - Crop with DPR awareness
 * - WebM to MP4 conversion
 * - Y-offset compensation for Chrome sharing bar
 */

export interface ProcessingOptions {
  cropWidth: number;
  cropHeight: number;
  cropOffsetY?: number;
  outputFormat: OutputFormat;
  onProgress?: (progress: number) => void;
}

/**
 * Processes a video blob using FFmpeg WASM
 */
export async function processVideo(
  inputBlob: Blob,
  options: ProcessingOptions
): Promise<Blob> {
  // Placeholder
  throw new Error("Client-side processing not yet implemented");
}
