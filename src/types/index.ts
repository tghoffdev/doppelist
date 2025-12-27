/**
 * Shared type definitions for the MRAID Capture Tool
 */

/** Supported output formats for video export */
export type OutputFormat = "mp4" | "webm";

/** IAB standard ad sizes */
export interface AdSize {
  width: number;
  height: number;
  label: string;
}

/** MRAID state values */
export type MRAIDState = "loading" | "default" | "expanded" | "resized" | "hidden";

/** MRAID placement types */
export type MRAIDPlacementType = "inline" | "interstitial";

/** Recording state */
export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  processingProgress: number;
  processingStatus: string;
}

/** Capture settings */
export interface CaptureSettings {
  width: number;
  height: number;
  outputFormat: OutputFormat;
  cropToIframe: boolean;
  cropOffsetY: number;
  showCustomCursor: boolean;
  cursorColor: string;
  cursorSize: number;
}

/** Platform identifiers for URL transformation */
export type AdPlatform =
  | "celtra"
  | "google"
  | "flashtalking"
  | "sizmek"
  | "generic";
