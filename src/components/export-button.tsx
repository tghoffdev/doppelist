"use client";

import { Button } from "@/components/ui/button";

/**
 * ExportButton Component
 *
 * Download/export functionality for captures.
 *
 * TODO: Phase 2/3 implementation
 * - Format selection (MP4/WebM)
 * - Processing choice modal (client vs server)
 * - Batch export as zip
 */

interface ExportButtonProps {
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}

export function ExportButton({
  disabled,
  onClick,
  label = "Export",
}: ExportButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}
