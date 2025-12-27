import type { AdSize } from "@/types";

/**
 * Batch Capture
 *
 * Orchestrates capturing screenshots/videos at multiple sizes.
 *
 * TODO: Phase 2 implementation
 * - Loop through selected sizes
 * - Resize container, wait for render, capture
 * - Progress reporting
 */

export interface BatchCaptureOptions {
  sizes: AdSize[];
  onProgress?: (completed: number, total: number) => void;
}

export interface BatchCaptureResult {
  size: AdSize;
  blob: Blob;
  filename: string;
}

/**
 * Captures screenshots at multiple sizes
 */
export async function batchCaptureScreenshots(
  renderAd: (size: AdSize) => Promise<HTMLElement>,
  options: BatchCaptureOptions
): Promise<BatchCaptureResult[]> {
  // Placeholder
  throw new Error("Batch capture not yet implemented");
}
