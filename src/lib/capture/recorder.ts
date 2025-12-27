/**
 * Video Recorder
 *
 * Handles MediaRecorder API for capturing video of ad units.
 * Uses getDisplayMedia with preferCurrentTab for tab capture.
 * Supports canvas-based cropping to clip to specific dimensions.
 */

export interface RecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
}

export type RecordingMode = "fullscreen" | "clip";

export interface CropConfig {
  /** Element to crop to, or a function that returns the element (for dynamic refs) */
  element: Element | (() => Element | null);
  width: number;
  height: number;
}

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
}

export interface RecorderInstance {
  start: () => void;
  stop: () => Promise<Blob>;
  pause: () => void;
  resume: () => void;
  getState: () => RecorderState;
  cleanup: () => void;
}

/**
 * Canvas-based cropping is always supported
 */
export function isRegionCaptureSupported(): boolean {
  return true;
}

/**
 * Request screen capture with preferCurrentTab
 */
async function requestRawScreenCapture(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "browser",
    },
    audio: false,
    // @ts-expect-error - preferCurrentTab is not in the type definitions yet
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  });

  return stream;
}

/**
 * Create a cropped stream using canvas
 * Draws only the specified element's area to a canvas and captures that
 */
function createCroppedStream(
  sourceStream: MediaStream,
  cropConfig: CropConfig
): { stream: MediaStream; cleanup: () => void } {
  const { element: elementOrGetter, width, height } = cropConfig;

  // Helper to get the current element (supports both direct element and getter function)
  const getElement = (): Element | null => {
    if (typeof elementOrGetter === "function") {
      return elementOrGetter();
    }
    return elementOrGetter;
  };

  // Create canvas for cropping
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Create video element to play the source stream
  const video = document.createElement("video");
  video.srcObject = sourceStream;
  video.muted = true;
  video.playsInline = true;
  video.play();

  let animationId: number;
  let isRunning = true;

  // Animation loop to draw cropped frames
  const drawFrame = () => {
    if (!isRunning) return;

    // Get current element (may change if component remounts)
    const element = getElement();
    if (!element) {
      animationId = requestAnimationFrame(drawFrame);
      return;
    }

    // Get element position relative to viewport
    const rect = element.getBoundingClientRect();

    // Calculate scale factor between video and viewport
    // The captured video is the full tab, so we need to map viewport coords to video coords
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (videoWidth && videoHeight) {
      const scaleX = videoWidth / viewportWidth;
      const scaleY = videoHeight / viewportHeight;

      // The ad is centered within the preview frame container
      // Calculate the ad's actual position (centered within the element)
      const adLeft = rect.left + (rect.width - width) / 2;
      const adTop = rect.top + (rect.height - height) / 2;

      // Source coordinates in video space - crop to just the ad area
      const sx = adLeft * scaleX;
      const sy = adTop * scaleY;
      const sw = width * scaleX;
      const sh = height * scaleY;

      // Draw cropped portion to canvas (1:1, no scaling)
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
    }

    animationId = requestAnimationFrame(drawFrame);
  };

  // Start drawing when video is ready
  video.onloadedmetadata = () => {
    drawFrame();
  };

  // Capture stream from canvas at 30fps
  const croppedStream = canvas.captureStream(30);

  const cleanup = () => {
    isRunning = false;
    cancelAnimationFrame(animationId);
    video.pause();
    video.srcObject = null;
  };

  return { stream: croppedStream, cleanup };
}

/**
 * Request screen capture with optional cropping
 */
export async function requestScreenCapture(
  cropConfig?: CropConfig | null
): Promise<{ stream: MediaStream; cleanup?: () => void }> {
  const rawStream = await requestRawScreenCapture();

  if (cropConfig) {
    const { stream, cleanup } = createCroppedStream(rawStream, cropConfig);

    // When the cropped stream ends, also stop the raw stream
    const combinedCleanup = () => {
      cleanup();
      rawStream.getTracks().forEach((track) => track.stop());
    };

    return { stream, cleanup: combinedCleanup };
  }

  return { stream: rawStream };
}

/**
 * Creates a new recorder instance
 */
export async function createRecorder(
  stream: MediaStream,
  options: RecorderOptions = {}
): Promise<RecorderInstance> {
  const {
    mimeType = "video/webm;codecs=vp9",
    videoBitsPerSecond = 2500000,
  } = options;

  // Check for MediaRecorder support
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    throw new Error(`MIME type ${mimeType} is not supported`);
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
  });

  const chunks: Blob[] = [];
  let startTime = 0;
  let pausedDuration = 0;
  let pauseStart = 0;

  const state: RecorderState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
  };

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return {
    start: () => {
      chunks.length = 0;
      startTime = Date.now();
      pausedDuration = 0;
      state.isRecording = true;
      state.isPaused = false;
      mediaRecorder.start(100); // Collect data every 100ms
    },

    stop: () => {
      return new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          state.isRecording = false;
          state.isPaused = false;
          state.duration = Date.now() - startTime - pausedDuration;

          if (chunks.length === 0) {
            reject(new Error("No data recorded"));
            return;
          }

          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error(`Recording error: ${event}`));
        };

        mediaRecorder.stop();
      });
    },

    pause: () => {
      if (state.isRecording && !state.isPaused) {
        mediaRecorder.pause();
        state.isPaused = true;
        pauseStart = Date.now();
      }
    },

    resume: () => {
      if (state.isRecording && state.isPaused) {
        mediaRecorder.resume();
        state.isPaused = false;
        pausedDuration += Date.now() - pauseStart;
      }
    },

    getState: () => ({
      ...state,
      duration: state.isRecording
        ? Date.now() - startTime - pausedDuration
        : state.duration,
    }),

    cleanup: () => {
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}

/**
 * Download a video blob
 */
export function downloadVideo(
  blob: Blob,
  filename: string = `recording-${Date.now()}.webm`
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
