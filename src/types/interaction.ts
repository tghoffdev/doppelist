/**
 * Interactive Mode Types
 *
 * Types for recording and replaying user interactions with ads.
 */

export type InteractionEventType =
  | "click"
  | "mousedown"
  | "mouseup"
  | "mousemove"
  | "touchstart"
  | "touchmove"
  | "touchend"
  | "scroll";

export interface TouchPoint {
  x: number;
  y: number;
  identifier?: number;
}

export interface InteractionEvent {
  /** Event type */
  type: InteractionEventType;
  /** Milliseconds since recording started */
  timestamp: number;
  /** X coordinate relative to iframe content */
  x: number;
  /** Y coordinate relative to iframe content */
  y: number;
  /** CSS selector path to target element (for replay targeting) */
  target?: string;
  /** For scroll events: vertical scroll position */
  scrollTop?: number;
  /** For scroll events: horizontal scroll position */
  scrollLeft?: number;
  /** For touch events: array of touch points */
  touches?: TouchPoint[];
  /** Button pressed (0=left, 1=middle, 2=right) */
  button?: number;
}

export interface InteractionRecording {
  /** Recorded events in chronological order */
  events: InteractionEvent[];
  /** Total duration in milliseconds */
  duration: number;
  /** Ad dimensions at time of recording */
  adSize: { width: number; height: number };
  /** ISO timestamp when recording started */
  recordedAt: string;
}

export type InteractiveMode = "idle" | "recording" | "recorded" | "replaying";

export interface InteractiveModeState {
  mode: InteractiveMode;
  events: InteractionEvent[];
  eventCount: number;
  duration: number;
  replayProgress?: {
    currentEvent: number;
    totalEvents: number;
  };
}
