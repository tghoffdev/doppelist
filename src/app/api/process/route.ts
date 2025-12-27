import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side FFmpeg processing endpoint
 *
 * Accepts: WebM blob, crop dimensions, output format
 * Returns: Processed MP4/WebM as streaming response
 *
 * TODO: Implement in Phase 3
 * - Install fluent-ffmpeg or use child_process
 * - Handle temp file cleanup
 * - Add rate limiting
 */
export async function POST(request: NextRequest) {
  // Stub - return 501 Not Implemented
  return NextResponse.json(
    { error: "Server-side processing not yet implemented" },
    { status: 501 }
  );
}
