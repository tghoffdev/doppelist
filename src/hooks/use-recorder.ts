"use client";

import { useState, useCallback, useRef } from "react";
import type { RecordingState } from "@/types";
import {
  requestScreenCapture,
  createRecorder,
  downloadVideo,
  isRegionCaptureSupported,
  type RecorderInstance,
  type RecordingMode,
  type CropConfig,
} from "@/lib/capture/recorder";

export interface UseRecorderOptions {
  onRecordingComplete?: (blob: Blob) => void;
}

export interface UseRecorderReturn {
  state: RecordingState;
  startRecording: (cropConfig?: CropConfig | null) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  /** Prepare recording (get permission) without starting */
  prepareRecording: (cropConfig?: CropConfig | null) => Promise<void>;
  /** Start a prepared recording */
  beginPreparedRecording: () => void;
  /** Whether a recording is prepared and ready to start */
  isPrepared: boolean;
  isSupported: boolean;
  isRegionCaptureSupported: boolean;
}

/**
 * Check if screen recording is supported
 */
function checkRecordingSupport(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    "getDisplayMedia" in navigator.mediaDevices &&
    typeof MediaRecorder !== "undefined"
  );
}

export function useRecorder(
  options: UseRecorderOptions = {}
): UseRecorderReturn {
  const { onRecordingComplete } = options;

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    processingProgress: 0,
    processingStatus: "",
  });

  const [isPrepared, setIsPrepared] = useState(false);
  const isPreparedRef = useRef(false); // Ref for reliable checking in callbacks
  const recorderRef = useRef<RecorderInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cropCleanupRef = useRef<(() => void) | null>(null);

  const isSupported = checkRecordingSupport();

  const startRecording = useCallback(
    async (cropConfig?: CropConfig | null) => {
      if (!isSupported) {
        throw new Error("Screen recording is not supported in this browser");
      }

      try {
        // Request screen capture with optional cropping
        const { stream, cleanup } = await requestScreenCapture(cropConfig);
        streamRef.current = stream;
        cropCleanupRef.current = cleanup || null;

        // Create recorder
        const recorder = await createRecorder(stream);
        recorderRef.current = recorder;

        // Handle stream ending (user clicked "Stop sharing")
        stream.getVideoTracks()[0].onended = () => {
          if (recorderRef.current?.getState().isRecording) {
            stopRecording();
          }
        };

        // Start recording
        recorder.start();

        setState((prev) => ({
          ...prev,
          isRecording: true,
        }));
      } catch (error) {
        console.error("Failed to start recording:", error);
        throw error;
      }
    },
    [isSupported]
  );

  // Prepare recording (get permission and set up stream) without starting
  const prepareRecording = useCallback(
    async (cropConfig?: CropConfig | null) => {
      if (!isSupported) {
        throw new Error("Screen recording is not supported in this browser");
      }

      try {
        // Request screen capture with optional cropping
        const { stream, cleanup } = await requestScreenCapture(cropConfig);
        streamRef.current = stream;
        cropCleanupRef.current = cleanup || null;

        // Create recorder but don't start it
        const recorder = await createRecorder(stream);
        recorderRef.current = recorder;

        // Handle stream ending (user clicked "Stop sharing")
        stream.getVideoTracks()[0].onended = () => {
          if (recorderRef.current?.getState().isRecording) {
            stopRecording();
          } else {
            // Clean up if not recording yet
            cleanupPrepared();
          }
        };

        isPreparedRef.current = true;
        setIsPrepared(true);
      } catch (error) {
        console.error("Failed to prepare recording:", error);
        throw error;
      }
    },
    [isSupported]
  );

  // Start a prepared recording
  const beginPreparedRecording = useCallback(() => {
    // Use ref for reliable check (avoids stale closure issues)
    if (!recorderRef.current || !isPreparedRef.current) {
      console.error("No prepared recording to start");
      return;
    }

    recorderRef.current.start();
    isPreparedRef.current = false;
    setIsPrepared(false);

    setState((prev) => ({
      ...prev,
      isRecording: true,
    }));
  }, []); // No dependencies needed - uses refs

  // Clean up a prepared but not started recording
  const cleanupPrepared = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.cleanup();
      recorderRef.current = null;
    }
    streamRef.current = null;
    if (cropCleanupRef.current) {
      cropCleanupRef.current();
      cropCleanupRef.current = null;
    }
    isPreparedRef.current = false;
    setIsPrepared(false);
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current) {
      return null;
    }

    try {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        processingStatus: "Stopping recording...",
      }));

      const blob = await recorderRef.current.stop();

      // Cleanup
      recorderRef.current.cleanup();
      recorderRef.current = null;
      streamRef.current = null;
      if (cropCleanupRef.current) {
        cropCleanupRef.current();
        cropCleanupRef.current = null;
      }

      setState({
        isRecording: false,
        isProcessing: false,
        processingProgress: 100,
        processingStatus: "",
      });

      // Notify callback
      onRecordingComplete?.(blob);

      return blob;
    } catch (error) {
      console.error("Failed to stop recording:", error);

      // Cleanup on error
      if (recorderRef.current) {
        recorderRef.current.cleanup();
        recorderRef.current = null;
      }
      streamRef.current = null;
      if (cropCleanupRef.current) {
        cropCleanupRef.current();
        cropCleanupRef.current = null;
      }

      setState({
        isRecording: false,
        isProcessing: false,
        processingProgress: 0,
        processingStatus: "",
      });

      throw error;
    }
  }, [onRecordingComplete]);

  return {
    state,
    startRecording,
    stopRecording,
    prepareRecording,
    beginPreparedRecording,
    isPrepared,
    isSupported,
    isRegionCaptureSupported: isRegionCaptureSupported(),
  };
}

// Re-export utilities and types
export { downloadVideo };
export type { RecordingMode, CropConfig };
