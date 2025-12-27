/**
 * Event Replayer
 *
 * Replays recorded interaction events on an iframe by dispatching
 * synthetic events at the recorded timestamps.
 */

import type { InteractionEvent, TouchPoint } from "@/types/interaction";

export interface ReplayCallbacks {
  onProgress?: (current: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class EventReplayer {
  private events: InteractionEvent[] = [];
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private currentIndex: number = 0;
  private animationId: number | null = null;
  private targetDocument: Document | null = null;
  private callbacks: ReplayCallbacks = {};

  /**
   * Load events for replay
   */
  loadEvents(events: InteractionEvent[]): void {
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp);
    this.currentIndex = 0;
  }

  /**
   * Start replaying events on the given iframe
   */
  async play(
    iframe: HTMLIFrameElement,
    callbacks: ReplayCallbacks = {}
  ): Promise<void> {
    if (this.isPlaying) {
      console.warn("[EventReplayer] Already playing");
      return;
    }

    if (this.events.length === 0) {
      console.warn("[EventReplayer] No events to replay");
      callbacks.onComplete?.();
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) {
        throw new Error("Cannot access iframe document");
      }

      this.targetDocument = iframeDoc;
      this.callbacks = callbacks;
      this.isPlaying = true;
      this.currentIndex = 0;
      this.startTime = performance.now();

      console.log(`[EventReplayer] Starting replay of ${this.events.length} events`);

      // Start the replay loop
      return new Promise((resolve, reject) => {
        const originalOnComplete = this.callbacks.onComplete;
        const originalOnError = this.callbacks.onError;

        this.callbacks.onComplete = () => {
          originalOnComplete?.();
          resolve();
        };

        this.callbacks.onError = (error) => {
          originalOnError?.(error);
          reject(error);
        };

        this.replayLoop();
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Stop replay
   */
  stop(): void {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.targetDocument = null;
  }

  /**
   * Get replay progress
   */
  getProgress(): { current: number; total: number } {
    return {
      current: this.currentIndex,
      total: this.events.length,
    };
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get total duration of loaded events
   */
  getDuration(): number {
    if (this.events.length === 0) return 0;
    return this.events[this.events.length - 1].timestamp;
  }

  private replayLoop = (): void => {
    if (!this.isPlaying || !this.targetDocument) {
      return;
    }

    const elapsed = performance.now() - this.startTime;

    // Dispatch all events that should have occurred by now
    while (
      this.currentIndex < this.events.length &&
      this.events[this.currentIndex].timestamp <= elapsed
    ) {
      const event = this.events[this.currentIndex];
      this.dispatchEvent(event);

      this.currentIndex++;
      this.callbacks.onProgress?.(this.currentIndex, this.events.length);
    }

    // Check if we're done
    if (this.currentIndex >= this.events.length) {
      console.log("[EventReplayer] Replay complete");
      this.isPlaying = false;
      this.callbacks.onComplete?.();
      return;
    }

    // Continue the loop
    this.animationId = requestAnimationFrame(this.replayLoop);
  };

  private dispatchEvent(event: InteractionEvent): void {
    if (!this.targetDocument) return;

    try {
      // Find target element
      const target = this.findTarget(event);

      switch (event.type) {
        case "click":
        case "mousedown":
        case "mouseup":
        case "mousemove":
          this.dispatchMouseEvent(event, target);
          break;

        case "touchstart":
        case "touchmove":
        case "touchend":
          this.dispatchTouchEvent(event, target);
          break;

        case "scroll":
          this.dispatchScrollEvent(event, target);
          break;
      }
    } catch (error) {
      console.warn("[EventReplayer] Error dispatching event:", error);
    }
  }

  private findTarget(event: InteractionEvent): Element {
    if (!this.targetDocument) {
      throw new Error("No target document");
    }

    // Try to find by selector first
    if (event.target) {
      try {
        const element = this.targetDocument.querySelector(event.target);
        if (element) return element;
      } catch {
        // Selector might be invalid, fall through to coordinate-based lookup
      }
    }

    // Fallback to coordinate-based lookup
    const element = this.targetDocument.elementFromPoint(event.x, event.y);
    return element || this.targetDocument.body;
  }

  private dispatchMouseEvent(event: InteractionEvent, target: Element): void {
    const mouseEvent = new MouseEvent(event.type, {
      bubbles: true,
      cancelable: true,
      view: this.targetDocument?.defaultView || window,
      clientX: event.x,
      clientY: event.y,
      screenX: event.x,
      screenY: event.y,
      button: event.button ?? 0,
      buttons: event.type === "mousedown" ? 1 : 0,
    });

    target.dispatchEvent(mouseEvent);

    // Also dispatch pointer event for modern ads
    const pointerType = event.type.replace("mouse", "pointer");
    const pointerEvent = new PointerEvent(pointerType, {
      bubbles: true,
      cancelable: true,
      view: this.targetDocument?.defaultView || window,
      clientX: event.x,
      clientY: event.y,
      screenX: event.x,
      screenY: event.y,
      button: event.button ?? 0,
      buttons: event.type === "mousedown" ? 1 : 0,
      pointerType: "mouse",
      isPrimary: true,
    });

    target.dispatchEvent(pointerEvent);
  }

  private dispatchTouchEvent(event: InteractionEvent, target: Element): void {
    const touches = event.touches || [{ x: event.x, y: event.y }];

    // Create Touch objects
    const touchList = touches.map((touch: TouchPoint, index: number) => {
      return new Touch({
        identifier: touch.identifier ?? index,
        target: target,
        clientX: touch.x,
        clientY: touch.y,
        screenX: touch.x,
        screenY: touch.y,
        pageX: touch.x,
        pageY: touch.y,
      });
    });

    // Determine which touch lists to populate based on event type
    let activeTouches: Touch[] = [];
    let changedTouches: Touch[] = touchList;
    let targetTouches: Touch[] = [];

    if (event.type === "touchstart" || event.type === "touchmove") {
      activeTouches = touchList;
      targetTouches = touchList;
    }

    const touchEvent = new TouchEvent(event.type, {
      bubbles: true,
      cancelable: true,
      view: this.targetDocument?.defaultView || window,
      touches: activeTouches,
      targetTouches: targetTouches,
      changedTouches: changedTouches,
    });

    target.dispatchEvent(touchEvent);

    // Also dispatch pointer events for touch
    const pointerType =
      event.type === "touchstart"
        ? "pointerdown"
        : event.type === "touchend"
          ? "pointerup"
          : "pointermove";

    const pointerEvent = new PointerEvent(pointerType, {
      bubbles: true,
      cancelable: true,
      view: this.targetDocument?.defaultView || window,
      clientX: event.x,
      clientY: event.y,
      screenX: event.x,
      screenY: event.y,
      pointerType: "touch",
      isPrimary: true,
    });

    target.dispatchEvent(pointerEvent);
  }

  private dispatchScrollEvent(event: InteractionEvent, target: Element): void {
    // For scroll, we directly set the scroll position (more reliable than events)
    if (event.scrollTop !== undefined || event.scrollLeft !== undefined) {
      if (target === this.targetDocument?.body || target === this.targetDocument?.documentElement) {
        // Document-level scroll
        if (event.scrollTop !== undefined) {
          this.targetDocument!.documentElement.scrollTop = event.scrollTop;
        }
        if (event.scrollLeft !== undefined) {
          this.targetDocument!.documentElement.scrollLeft = event.scrollLeft;
        }
      } else {
        // Element-level scroll
        if (event.scrollTop !== undefined) {
          target.scrollTop = event.scrollTop;
        }
        if (event.scrollLeft !== undefined) {
          target.scrollLeft = event.scrollLeft;
        }
      }
    }

    // Also dispatch the scroll event for any listeners
    const scrollEvent = new Event("scroll", {
      bubbles: true,
      cancelable: false,
    });
    target.dispatchEvent(scrollEvent);
  }
}

// Singleton instance for convenience
let replayerInstance: EventReplayer | null = null;

export function getEventReplayer(): EventReplayer {
  if (!replayerInstance) {
    replayerInstance = new EventReplayer();
  }
  return replayerInstance;
}
