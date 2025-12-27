/**
 * useInteractiveMode Hook
 *
 * React hook for managing interactive mode - recording user interactions
 * and replaying them for video capture.
 */

import { useState, useCallback, useRef } from "react";
import { OverlayRecorder } from "@/lib/interaction/overlay-recorder";
import { EventReplayer } from "@/lib/interaction/event-replayer";
import type {
  InteractionEvent,
  InteractiveMode,
  InteractiveModeState,
} from "@/types/interaction";

export interface UseInteractiveModeOptions {
  /** Callback when replay completes */
  onReplayComplete?: () => void;
  /** Callback with replay progress */
  onReplayProgress?: (current: number, total: number) => void;
}

export interface RecordingOptions {
  /** Container element holding the iframe */
  container: HTMLElement;
  /** Ad width */
  width: number;
  /** Ad height */
  height: number;
}

export interface UseInteractiveModeReturn {
  /** Current interactive mode state */
  state: InteractiveModeState;
  /** Start recording interactions using overlay */
  startRecording: (options: RecordingOptions) => boolean;
  /** Stop recording and save events */
  stopRecording: () => InteractionEvent[];
  /** Replay recorded events on the iframe */
  replay: (iframe: HTMLIFrameElement) => Promise<void>;
  /** Clear recorded events */
  clear: () => void;
  /** Check if there are recorded events */
  hasEvents: boolean;
}

export function useInteractiveMode(
  options: UseInteractiveModeOptions = {}
): UseInteractiveModeReturn {
  const [mode, setMode] = useState<InteractiveMode>("idle");
  const [events, setEvents] = useState<InteractionEvent[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [replayProgress, setReplayProgress] = useState<{
    currentEvent: number;
    totalEvents: number;
  } | undefined>();

  const recorderRef = useRef<OverlayRecorder | null>(null);
  const replayerRef = useRef<EventReplayer | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback((recordingOptions: RecordingOptions): boolean => {
    if (mode !== "idle" && mode !== "recorded") {
      console.warn("[useInteractiveMode] Cannot start recording in current mode:", mode);
      return false;
    }

    // Create new overlay recorder
    const recorder = new OverlayRecorder();
    const success = recorder.start({
      container: recordingOptions.container,
      width: recordingOptions.width,
      height: recordingOptions.height,
      onEventCountChange: (count) => setEventCount(count),
    });

    if (!success) {
      return false;
    }

    recorderRef.current = recorder;
    setMode("recording");
    setEventCount(0);
    setDuration(0);

    // Update duration periodically during recording
    updateIntervalRef.current = setInterval(() => {
      if (recorderRef.current) {
        setDuration(recorderRef.current.getDuration());
      }
    }, 100);

    return true;
  }, [mode]);

  const stopRecording = useCallback((): InteractionEvent[] => {
    if (mode !== "recording" || !recorderRef.current) {
      return events;
    }

    // Clear update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Stop recording and get events
    const recordedEvents = recorderRef.current.stop();
    const recordedDuration = recorderRef.current.getDuration();

    setEvents(recordedEvents);
    setEventCount(recordedEvents.length);
    setDuration(recordedDuration);
    setMode("recorded");

    recorderRef.current = null;

    return recordedEvents;
  }, [mode, events]);

  const replay = useCallback(async (iframe: HTMLIFrameElement): Promise<void> => {
    if (mode !== "recorded" || events.length === 0) {
      console.warn("[useInteractiveMode] No events to replay");
      return;
    }

    setMode("replaying");
    setReplayProgress({ currentEvent: 0, totalEvents: events.length });

    // Create replayer and load events
    const replayer = new EventReplayer();
    replayer.loadEvents(events);
    replayerRef.current = replayer;

    try {
      await replayer.play(iframe, {
        onProgress: (current, total) => {
          setReplayProgress({ currentEvent: current, totalEvents: total });
          options.onReplayProgress?.(current, total);
        },
        onComplete: () => {
          setMode("recorded");
          setReplayProgress(undefined);
          options.onReplayComplete?.();
        },
        onError: (error) => {
          console.error("[useInteractiveMode] Replay error:", error);
          setMode("recorded");
          setReplayProgress(undefined);
        },
      });
    } catch (error) {
      console.error("[useInteractiveMode] Replay failed:", error);
      setMode("recorded");
      setReplayProgress(undefined);
    } finally {
      replayerRef.current = null;
    }
  }, [mode, events, options]);

  const clear = useCallback(() => {
    // Stop any active recording
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    // Stop any active replay
    if (replayerRef.current) {
      replayerRef.current.stop();
      replayerRef.current = null;
    }

    // Clear update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setMode("idle");
    setEvents([]);
    setEventCount(0);
    setDuration(0);
    setReplayProgress(undefined);
  }, []);

  return {
    state: {
      mode,
      events,
      eventCount,
      duration,
      replayProgress,
    },
    startRecording,
    stopRecording,
    replay,
    clear,
    hasEvents: events.length > 0,
  };
}
