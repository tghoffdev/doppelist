import type { AdPlatform } from "@/types";

/**
 * Platform-specific URL transformations
 *
 * Converts preview URLs from various ad platforms into
 * embeddable iframe URLs.
 *
 * TODO: Phase 1 implementation
 * - Add transformations for each platform
 * - Auto-detect platform from URL
 */

/**
 * Detects the ad platform from a preview URL
 */
export function detectPlatform(url: string): AdPlatform {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes("celtra")) return "celtra";
    if (hostname.includes("doubleclick") || hostname.includes("google"))
      return "google";
    if (hostname.includes("flashtalking")) return "flashtalking";
    if (hostname.includes("sizmek")) return "sizmek";

    return "generic";
  } catch {
    return "generic";
  }
}

/**
 * Transforms a preview URL to an embeddable iframe URL
 */
export function transformPreviewUrl(url: string): string {
  const platform = detectPlatform(url);

  switch (platform) {
    case "celtra":
      return transformCeltraUrl(url);
    case "google":
      return transformGoogleUrl(url);
    case "flashtalking":
      return transformFlashtalkingUrl(url);
    case "sizmek":
      return transformSizmekUrl(url);
    default:
      return url;
  }
}

function transformCeltraUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const newHostname = "preview-sandbox." + parsed.hostname;
    const basePath = parsed.pathname.replace(/\/$/, "");
    const newPath = basePath + "/frame";
    return `${parsed.protocol}//${newHostname}${newPath}`;
  } catch {
    return url;
  }
}

function transformGoogleUrl(url: string): string {
  // TODO: Implement Google/DCM URL transformation
  return url;
}

function transformFlashtalkingUrl(url: string): string {
  // TODO: Implement Flashtalking URL transformation
  return url;
}

function transformSizmekUrl(url: string): string {
  // TODO: Implement Sizmek URL transformation
  return url;
}
