"use client";

import { Button } from "@/components/ui/button";
import type { InteractiveModeState } from "@/types/interaction";

interface InteractiveControlsProps {
  state: InteractiveModeState;
  hasContent: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRender: () => void;
  onClear: () => void;
  isRenderDisabled?: boolean;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${seconds}.${tenths}s`;
}

export function InteractiveControls({
  state,
  hasContent,
  onStartRecording,
  onStopRecording,
  onRender,
  onClear,
  isRenderDisabled = false,
}: InteractiveControlsProps) {
  const { mode, eventCount, duration, replayProgress } = state;

  // Idle state - show "Interactive" button
  if (mode === "idle") {
    return (
      <Button
        onClick={onStartRecording}
        variant="outline"
        size="sm"
        disabled={!hasContent}
        title={!hasContent ? "Load an ad first" : "Record your interactions with the ad"}
      >
        Interactive
      </Button>
    );
  }

  // Recording state - show recording indicator and stop button
  if (mode === "recording") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-muted-foreground">
            Recording: {eventCount} events ({formatDuration(duration)})
          </span>
        </div>
        <Button onClick={onStopRecording} variant="destructive" size="sm">
          Stop
        </Button>
      </div>
    );
  }

  // Recorded state - show render and clear buttons
  if (mode === "recorded") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {eventCount} events ({formatDuration(duration)})
        </span>
        <Button
          onClick={onRender}
          size="sm"
          disabled={isRenderDisabled || eventCount === 0}
        >
          Render Video
        </Button>
        <Button onClick={onClear} variant="outline" size="sm">
          Clear
        </Button>
      </div>
    );
  }

  // Replaying state - show progress
  if (mode === "replaying" && replayProgress) {
    const percent = Math.round(
      (replayProgress.currentEvent / replayProgress.totalEvents) * 100
    );
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">
            Rendering... {replayProgress.currentEvent}/{replayProgress.totalEvents} ({percent}%)
          </span>
        </div>
      </div>
    );
  }

  return null;
}
