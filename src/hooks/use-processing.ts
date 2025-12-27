"use client";

import { useState, useCallback } from "react";
import type { OutputFormat } from "@/types";

/**
 * useProcessing Hook
 *
 * Manages video processing state (client or server).
 *
 * TODO: Phase 1/3 implementation
 * - Client-side FFmpeg WASM processing
 * - Server-side processing with ad modal
 * - Progress tracking
 */

export interface UseProcessingOptions {
  preferServer?: boolean;
}

export interface UseProcessingReturn {
  isProcessing: boolean;
  progress: number;
  status: string;
  processVideo: (
    blob: Blob,
    cropWidth: number,
    cropHeight: number,
    format: OutputFormat
  ) => Promise<Blob>;
}

export function useProcessing(
  options?: UseProcessingOptions
): UseProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const processVideo = useCallback(
    async (
      blob: Blob,
      cropWidth: number,
      cropHeight: number,
      format: OutputFormat
    ): Promise<Blob> => {
      // Placeholder - return input blob unchanged
      console.log("Processing not yet implemented");
      return blob;
    },
    []
  );

  return {
    isProcessing,
    progress,
    status,
    processVideo,
  };
}
