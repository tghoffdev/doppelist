/**
 * Celtra Vendor Handler
 *
 * Detects Celtra tags and transforms them to use Celtra's preview sandbox
 * instead of trying to render raw MRAID tags.
 */

export interface CeltraDetectionResult {
  isCeltra: boolean;
  adId?: string;
  previewUrl?: string;
}

/**
 * Detects if a tag is a Celtra tag and extracts the ad ID
 */
export function detectCeltra(tag: string): CeltraDetectionResult {
  // Check for Celtra CDN patterns
  const celtraPatterns = [
    /cdn\.celtra\.com\/ads\/([a-f0-9]+)\//i,
    /ads\.celtra\.com\/([a-f0-9]+)\//i,
  ];

  for (const pattern of celtraPatterns) {
    const match = tag.match(pattern);
    if (match && match[1]) {
      const adId = match[1];
      return {
        isCeltra: true,
        adId,
        previewUrl: buildCeltraPreviewUrl(adId),
      };
    }
  }

  // Check for celtra-ad-v class (another indicator)
  if (tag.includes("celtra-ad-v") || tag.includes("celtra.com")) {
    // Try to find any 8-character hex ID in the tag
    const hexIdMatch = tag.match(/\/([a-f0-9]{8})\//i);
    if (hexIdMatch && hexIdMatch[1]) {
      return {
        isCeltra: true,
        adId: hexIdMatch[1],
        previewUrl: buildCeltraPreviewUrl(hexIdMatch[1]),
      };
    }

    return {
      isCeltra: true,
      // No ad ID found, but it's still Celtra
    };
  }

  return { isCeltra: false };
}

/**
 * Builds a Celtra preview sandbox URL from an ad ID
 */
export function buildCeltraPreviewUrl(adId: string): string {
  // Use the generic Celtra preview sandbox
  return `https://preview-sandbox.celtra.com/preview/${adId}/frame`;
}
