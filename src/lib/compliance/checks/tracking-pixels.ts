/**
 * Tracking Pixel Compliance Checks
 *
 * Note: Tracking pixels are displayed in the MRAID event log rather than
 * as compliance checks, since they fire asynchronously and don't have
 * specific pass/fail criteria.
 */

import type { PixelInfo, ComplianceCheck } from "../types";

export function runTrackingPixelChecks(
  _pixels: PixelInfo[]
): ComplianceCheck[] {
  // Pixels are tracked in the event log, not as compliance checks
  return [];
}
