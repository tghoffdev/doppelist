/**
 * Overlay Event Recorder
 *
 * Records clicks by detecting when the iframe receives focus (window blur).
 * The overlay is purely visual and doesn't block any events.
 * This allows real clicks to pass through while we still record them.
 */

import type {
  InteractionEvent,
  InteractionEventType,
  TouchPoint,
} from "@/types/interaction";

export interface OverlayRecorderOptions {
  /** The container element that holds the iframe */
  container: HTMLElement;
  /** Width of the ad */
  width: number;
  /** Height of the ad */
  height: number;
  /** Callback when event count changes */
  onEventCountChange?: (count: number) => void;
}

export class OverlayRecorder {
  private events: InteractionEvent[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private overlay: HTMLDivElement | null = null;
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private width: number = 0;
  private height: number = 0;
  private onEventCountChange?: (count: number) => void;

  // Track last mouse position for click detection
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private isMouseOverAd: boolean = false;

  // Bound handlers for cleanup
  private handleWindowBlur: () => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleTouchStart: (e: TouchEvent) => void;

  constructor() {
    this.handleWindowBlur = this.onWindowBlur.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleTouchStart = this.onTouchStart.bind(this);
  }

  /**
   * Start recording events
   */
  start(options: OverlayRecorderOptions): boolean {
    if (this.isRecording) {
      console.warn("[OverlayRecorder] Already recording");
      return false;
    }

    const { container, width, height, onEventCountChange } = options;

    // Find the iframe within the container
    const iframe = container.querySelector("iframe");
    if (!iframe) {
      console.warn("[OverlayRecorder] No iframe found in container");
      return false;
    }

    this.container = container;
    this.iframe = iframe;
    this.width = width;
    this.height = height;
    this.onEventCountChange = onEventCountChange;
    this.events = [];
    this.startTime = performance.now();

    // Create visual overlay (doesn't block events)
    this.createOverlay();

    // Attach event listeners
    this.attachEventListeners();

    this.isRecording = true;
    console.log("[OverlayRecorder] Started recording");
    return true;
  }

  /**
   * Stop recording and remove overlay
   */
  stop(): InteractionEvent[] {
    if (!this.isRecording) {
      return this.events;
    }

    this.isRecording = false;
    this.detachEventListeners();
    this.removeOverlay();

    console.log(`[OverlayRecorder] Stopped. Captured ${this.events.length} events`);
    return [...this.events];
  }

  getEventCount(): number {
    return this.events.length;
  }

  getDuration(): number {
    if (!this.isRecording) {
      return this.events.length > 0
        ? this.events[this.events.length - 1].timestamp
        : 0;
    }
    return performance.now() - this.startTime;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  clear(): void {
    this.events = [];
  }

  private createOverlay(): void {
    if (!this.container || !this.iframe) return;

    // Create overlay - pointer-events: none so it doesn't block clicks
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      pointer-events: none;
      border: 3px solid #ef4444;
      box-sizing: border-box;
    `;

    // Recording indicator
    const indicator = document.createElement("div");
    indicator.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(239, 68, 68, 0.95);
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    indicator.innerHTML = `
      <span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 1s infinite;"></span>
      REC
    `;
    this.overlay.appendChild(indicator);

    // Add animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes clickRipple {
        0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
      }
    `;
    this.overlay.appendChild(style);

    // Position container
    const containerStyle = getComputedStyle(this.container);
    if (containerStyle.position === "static") {
      this.container.style.position = "relative";
    }

    const adContainer = this.iframe.parentElement;
    if (adContainer) {
      adContainer.style.position = "relative";
      adContainer.appendChild(this.overlay);
    } else {
      this.container.appendChild(this.overlay);
    }
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.container = null;
    this.iframe = null;
  }

  private attachEventListeners(): void {
    // Track mouse position on document level
    document.addEventListener("mousemove", this.handleMouseMove, true);

    // Detect clicks via window blur (iframe receives focus when clicked)
    window.addEventListener("blur", this.handleWindowBlur);

    // Touch events - we can capture these on the container
    this.container?.addEventListener("touchstart", this.handleTouchStart, { capture: true, passive: true });
  }

  private detachEventListeners(): void {
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    window.removeEventListener("blur", this.handleWindowBlur);
    this.container?.removeEventListener("touchstart", this.handleTouchStart, { capture: true });
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isRecording || !this.iframe) return;

    const rect = this.iframe.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if mouse is over the ad
    this.isMouseOverAd = x >= 0 && y >= 0 && x <= this.width && y <= this.height;

    if (this.isMouseOverAd) {
      this.lastMouseX = x;
      this.lastMouseY = y;
    }
  }

  private onWindowBlur(): void {
    if (!this.isRecording || !this.isMouseOverAd) return;

    // Window blur when mouse is over ad = user clicked the iframe
    const timestamp = performance.now() - this.startTime;
    const x = this.lastMouseX;
    const y = this.lastMouseY;

    // Record click
    this.recordEvent("click", x, y, timestamp);
    console.log(`[OverlayRecorder] Captured click at (${Math.round(x)}, ${Math.round(y)})`);

    // Show ripple effect
    this.showClickRipple(x, y);

    // Re-focus parent window after a brief delay so we can capture more clicks
    setTimeout(() => {
      window.focus();
    }, 100);
  }

  private onTouchStart(event: TouchEvent): void {
    if (!this.isRecording || !this.iframe) return;

    const rect = this.iframe.getBoundingClientRect();
    const touch = event.touches[0];
    if (!touch) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Only record if within bounds
    if (x < 0 || y < 0 || x > this.width || y > this.height) {
      return;
    }

    const timestamp = performance.now() - this.startTime;
    const touches: TouchPoint[] = Array.from(event.touches).map((t) => ({
      x: Math.round(t.clientX - rect.left),
      y: Math.round(t.clientY - rect.top),
      identifier: t.identifier,
    }));

    this.recordTouchEvent("touchstart", x, y, timestamp, touches);
    console.log(`[OverlayRecorder] Captured touch at (${Math.round(x)}, ${Math.round(y)})`);
    this.showClickRipple(x, y);
  }

  private showClickRipple(x: number, y: number): void {
    if (!this.overlay) return;

    const ripple = document.createElement("div");
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.4);
      border: 3px solid rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      pointer-events: none;
      animation: clickRipple 0.5s ease-out forwards;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    `;
    this.overlay.appendChild(ripple);

    setTimeout(() => ripple.remove(), 500);
  }

  private recordEvent(
    type: InteractionEventType,
    x: number,
    y: number,
    timestamp: number,
    button?: number
  ): void {
    const event: InteractionEvent = {
      type,
      timestamp: Math.round(timestamp),
      x: Math.round(x),
      y: Math.round(y),
      button,
    };
    this.events.push(event);
    this.onEventCountChange?.(this.events.length);
  }

  private recordTouchEvent(
    type: InteractionEventType,
    x: number,
    y: number,
    timestamp: number,
    touches?: TouchPoint[]
  ): void {
    const event: InteractionEvent = {
      type,
      timestamp: Math.round(timestamp),
      x: Math.round(x),
      y: Math.round(y),
      touches,
    };
    this.events.push(event);
    this.onEventCountChange?.(this.events.length);
  }
}

// Singleton
let overlayRecorderInstance: OverlayRecorder | null = null;

export function getOverlayRecorder(): OverlayRecorder {
  if (!overlayRecorderInstance) {
    overlayRecorderInstance = new OverlayRecorder();
  }
  return overlayRecorderInstance;
}
