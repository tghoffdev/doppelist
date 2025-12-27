/**
 * Event Recorder
 *
 * Records user interactions (clicks, mouse movements, touches, scrolls)
 * within an iframe for later replay.
 */

import type {
  InteractionEvent,
  InteractionEventType,
  TouchPoint,
} from "@/types/interaction";

// Throttle interval for mousemove events (ms)
const MOUSEMOVE_THROTTLE = 16; // ~60fps

/**
 * Get a CSS selector path for an element
 */
function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === "string") {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        selector += "." + classes.join(".");
      }
    }

    // Add nth-child if there are siblings of the same type
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
}

export class EventRecorder {
  private events: InteractionEvent[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private listeners: Map<string, EventListener> = new Map();
  private lastMouseMoveTime: number = 0;
  private targetDocument: Document | null = null;

  /**
   * Start recording events from the given iframe
   */
  start(iframe: HTMLIFrameElement): boolean {
    if (this.isRecording) {
      console.warn("[EventRecorder] Already recording");
      return false;
    }

    try {
      // Try to access iframe content (will fail for cross-origin)
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) {
        console.warn("[EventRecorder] Cannot access iframe document (cross-origin?)");
        return false;
      }

      this.targetDocument = iframeDoc;
      this.events = [];
      this.startTime = performance.now();
      this.isRecording = true;

      // Attach event listeners
      this.attachListeners(iframeDoc);

      console.log("[EventRecorder] Started recording");
      return true;
    } catch (error) {
      console.error("[EventRecorder] Failed to start:", error);
      return false;
    }
  }

  /**
   * Stop recording and return the captured events
   */
  stop(): InteractionEvent[] {
    if (!this.isRecording) {
      return this.events;
    }

    this.isRecording = false;

    // Remove event listeners
    if (this.targetDocument) {
      this.detachListeners(this.targetDocument);
    }

    this.targetDocument = null;

    console.log(`[EventRecorder] Stopped. Captured ${this.events.length} events`);
    return [...this.events];
  }

  /**
   * Get current event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Get recording duration in ms
   */
  getDuration(): number {
    if (!this.isRecording) {
      return this.events.length > 0
        ? this.events[this.events.length - 1].timestamp
        : 0;
    }
    return performance.now() - this.startTime;
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Clear recorded events
   */
  clear(): void {
    this.events = [];
  }

  private attachListeners(doc: Document): void {
    const eventTypes: InteractionEventType[] = [
      "click",
      "mousedown",
      "mouseup",
      "mousemove",
      "touchstart",
      "touchmove",
      "touchend",
      "scroll",
    ];

    for (const eventType of eventTypes) {
      const handler = this.createHandler(eventType);
      this.listeners.set(eventType, handler);
      doc.addEventListener(eventType, handler, { capture: true, passive: true });
    }
  }

  private detachListeners(doc: Document): void {
    for (const [eventType, handler] of this.listeners.entries()) {
      doc.removeEventListener(eventType, handler, { capture: true });
    }
    this.listeners.clear();
  }

  private createHandler(eventType: InteractionEventType): EventListener {
    return (event: Event) => {
      if (!this.isRecording) return;

      const timestamp = performance.now() - this.startTime;

      // Throttle mousemove events
      if (eventType === "mousemove") {
        if (timestamp - this.lastMouseMoveTime < MOUSEMOVE_THROTTLE) {
          return;
        }
        this.lastMouseMoveTime = timestamp;
      }

      const interactionEvent = this.createInteractionEvent(
        eventType,
        event,
        timestamp
      );

      if (interactionEvent) {
        this.events.push(interactionEvent);
      }
    };
  }

  private createInteractionEvent(
    type: InteractionEventType,
    event: Event,
    timestamp: number
  ): InteractionEvent | null {
    // Handle mouse events
    if (event instanceof MouseEvent) {
      const target = event.target instanceof Element
        ? getElementSelector(event.target)
        : undefined;

      return {
        type,
        timestamp: Math.round(timestamp),
        x: event.clientX,
        y: event.clientY,
        target,
        button: event.button,
      };
    }

    // Handle touch events
    if (event instanceof TouchEvent) {
      const touches: TouchPoint[] = Array.from(event.touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
        identifier: touch.identifier,
      }));

      // Use first touch for primary coordinates
      const primaryTouch = event.touches[0] || event.changedTouches[0];
      const target = event.target instanceof Element
        ? getElementSelector(event.target)
        : undefined;

      return {
        type,
        timestamp: Math.round(timestamp),
        x: primaryTouch?.clientX ?? 0,
        y: primaryTouch?.clientY ?? 0,
        target,
        touches,
      };
    }

    // Handle scroll events
    if (type === "scroll") {
      const target = event.target;
      let scrollTop = 0;
      let scrollLeft = 0;

      if (target instanceof Element) {
        scrollTop = target.scrollTop;
        scrollLeft = target.scrollLeft;
      } else if (target === this.targetDocument && this.targetDocument) {
        scrollTop = this.targetDocument.documentElement.scrollTop;
        scrollLeft = this.targetDocument.documentElement.scrollLeft;
      }

      return {
        type,
        timestamp: Math.round(timestamp),
        x: 0,
        y: 0,
        scrollTop,
        scrollLeft,
      };
    }

    return null;
  }
}

// Singleton instance for convenience
let recorderInstance: EventRecorder | null = null;

export function getEventRecorder(): EventRecorder {
  if (!recorderInstance) {
    recorderInstance = new EventRecorder();
  }
  return recorderInstance;
}
