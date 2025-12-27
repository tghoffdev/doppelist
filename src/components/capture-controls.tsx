"use client";

import { Button } from "@/components/ui/button";
import type { RecordingState, OutputFormat } from "@/types";

type RecordingMode = "fullscreen" | "clip";

interface BatchProgress {
  current: number;
  total: number;
  currentSize: string;
}

interface CaptureControlsProps {
  recordingState: RecordingState;
  hasContent: boolean;
  onScreenshot: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onReloadAndRecord?: () => void;
  isCapturing?: boolean;
  batchSizesCount?: number;
  onBatchScreenshot?: () => void;
  batchProgress?: BatchProgress | null;
  recordingMode?: RecordingMode;
  onRecordingModeChange?: (mode: RecordingMode) => void;
  isRegionCaptureSupported?: boolean;
  isCountingDown?: boolean;
  outputFormat?: OutputFormat;
  onOutputFormatChange?: (format: OutputFormat) => void;
  conversionProgress?: { progress: number; status: string } | null;
}

export function CaptureControls({
  recordingState,
  hasContent,
  onScreenshot,
  onStartRecording,
  onStopRecording,
  onReloadAndRecord,
  isCapturing = false,
  batchSizesCount = 0,
  onBatchScreenshot,
  batchProgress,
  recordingMode = "clip",
  onRecordingModeChange,
  isRegionCaptureSupported = false,
  isCountingDown = false,
  outputFormat = "webm",
  onOutputFormatChange,
  conversionProgress,
}: CaptureControlsProps) {
  const { isRecording, isProcessing, processingStatus } = recordingState;

  // Show conversion progress
  if (conversionProgress) {
    return (
      <div className="flex items-center gap-2">
        <Button disabled variant="secondary" size="sm">
          {conversionProgress.status}
        </Button>
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${conversionProgress.progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {conversionProgress.progress}%
        </span>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex items-center gap-2">
        <Button disabled variant="secondary" size="sm">
          {processingStatus || "Processing..."}
        </Button>
      </div>
    );
  }

  if (isCountingDown) {
    return (
      <div className="flex items-center gap-2">
        <Button disabled variant="secondary" size="sm">
          Starting...
        </Button>
        <span className="flex items-center gap-2 text-xs text-orange-500">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          Get ready
        </span>
      </div>
    );
  }

  if (batchProgress) {
    return (
      <div className="flex items-center gap-2">
        <Button disabled variant="secondary" size="sm">
          {batchProgress.current}/{batchProgress.total}: {batchProgress.currentSize}
        </Button>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Batch capture...
        </span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onStopRecording} variant="destructive" size="sm">
          Stop Recording
        </Button>
        <span className="flex items-center gap-2 text-xs text-destructive">
          <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          Recording
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onScreenshot}
        variant="outline"
        size="sm"
        disabled={!hasContent || isCapturing}
      >
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {isCapturing ? "Capturing..." : "Screenshot"}
      </Button>
      {/* Batch button - hidden for now */}
      {false && batchSizesCount > 0 && onBatchScreenshot && (
        <Button
          onClick={onBatchScreenshot}
          variant="outline"
          size="sm"
          disabled={!hasContent || isCapturing}
        >
          Batch ({batchSizesCount})
        </Button>
      )}

      {/* Recording mode toggle */}
      {onRecordingModeChange && (
        <div className="flex border border-border rounded-md overflow-hidden">
          <button
            onClick={() => onRecordingModeChange("clip")}
            disabled={!isRegionCaptureSupported}
            className={`px-2 py-1 text-xs transition-colors flex items-center gap-1 ${
              recordingMode === "clip"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            } ${!isRegionCaptureSupported ? "opacity-50 cursor-not-allowed" : ""}`}
            title={
              isRegionCaptureSupported
                ? "Record just the ad"
                : "Clip mode not supported in this browser"
            }
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m0 2v2m0-2H5m2 0h2m10 8v-2m0 2v2m0-2h-2m2 0h2M5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
            </svg>
            Clip
          </button>
          <button
            onClick={() => onRecordingModeChange("fullscreen")}
            className={`px-2 py-1 text-xs transition-colors border-l border-border flex items-center gap-1 ${
              recordingMode === "fullscreen"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
            title="Record the full browser tab"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Full
          </button>
        </div>
      )}

      {/* Output format toggle */}
      {onOutputFormatChange && (
        <div className="flex border border-border rounded-md overflow-hidden">
          <button
            onClick={() => onOutputFormatChange("webm")}
            className={`px-2 py-1 text-xs transition-colors ${
              outputFormat === "webm"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
            title="WebM format (faster, smaller)"
          >
            WebM
          </button>
          <button
            onClick={() => onOutputFormatChange("mp4")}
            className={`px-2 py-1 text-xs transition-colors border-l border-border ${
              outputFormat === "mp4"
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
            title="MP4 format (slower conversion, wider compatibility)"
          >
            MP4
          </button>
        </div>
      )}

      <Button
        onClick={onStartRecording}
        variant="default"
        size="sm"
        disabled={!hasContent}
      >
        <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
        </svg>
        Record
      </Button>
      {onReloadAndRecord && (
        <Button
          onClick={onReloadAndRecord}
          variant="secondary"
          size="sm"
          disabled={!hasContent}
          title="Reload the ad and record from the beginning"
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reload & Record
        </Button>
      )}
    </div>
  );
}
