/**
 * Screenshot Capture
 *
 * Captures screenshots using screen capture API with canvas cropping.
 * Falls back to html2canvas if screen capture is not available.
 */

export interface ScreenshotOptions {
  /** Target element to capture (container for positioning) */
  element: HTMLElement;
  /** Desired width */
  width: number;
  /** Desired height */
  height: number;
  /** Background color */
  backgroundColor?: string;
  /** Image format */
  format?: "png" | "jpeg";
  /** JPEG quality (0-1) */
  quality?: number;
}

export interface ScreenshotResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Capture a screenshot using screen capture and canvas cropping
 * This avoids html2canvas issues with modern CSS color functions
 */
export async function captureScreenshot(
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  const {
    element,
    width,
    height,
    format = "png",
    quality = 0.92,
  } = options;

  // Request screen capture
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "browser",
    },
    audio: false,
    // @ts-expect-error - preferCurrentTab is not in the type definitions yet
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  });

  try {
    // Create video element to capture a frame
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    // Wait for video to be ready
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        // Wait a frame for the video to actually render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      };
    });

    // Get element position for cropping
    const rect = element.getBoundingClientRect();
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = videoWidth / viewportWidth;
    const scaleY = videoHeight / viewportHeight;

    // Calculate the ad's centered position within the element
    const adLeft = rect.left + (rect.width - width) / 2;
    const adTop = rect.top + (rect.height - height) / 2;

    // Source coordinates in video space
    const sx = adLeft * scaleX;
    const sy = adTop * scaleY;
    const sw = width * scaleX;
    const sh = height * scaleY;

    // Create canvas and draw cropped frame
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

    // Convert to blob
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        },
        mimeType,
        quality
      );
    });

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    // Always stop the stream
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * Download a screenshot blob
 */
export function downloadScreenshot(
  blob: Blob,
  filename: string = `screenshot-${Date.now()}.png`
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
