/**
 * Proof Pack Generator
 *
 * Creates a comprehensive QA proof package including:
 * - Screenshot
 * - Recording (optional)
 * - Compliance results
 * - Event log
 * - Tag source
 * - Metadata
 */

import JSZip from "jszip";
import type { ComplianceResult } from "@/lib/compliance";
import type { MRAIDEvent } from "@/components/audit-panel";
import type { DetectedMacro } from "@/lib/macros/detector";

export interface TextChange {
  original: string;
  current: string;
  type?: string;
}

export interface ProofPackData {
  /** Screenshot blob */
  screenshot?: Blob;
  /** Recording blob */
  recording?: Blob;
  /** Recording format */
  recordingFormat?: "webm" | "mp4";
  /** Compliance check results */
  compliance?: ComplianceResult | null;
  /** Event log */
  events: MRAIDEvent[];
  /** Detected macros */
  macros: DetectedMacro[];
  /** Original tag source */
  originalTag?: string;
  /** Modified tag (if personalized/fixed) */
  modifiedTag?: string;
  /** Text personalization changes */
  textChanges?: TextChange[];
  /** Macro replacement values (for URL resolution) */
  macroValues?: Record<string, string>;
  /** Whether click macro fix was specifically applied via compliance */
  clickMacroFixApplied?: boolean;
  /** Metadata */
  metadata: ProofMetadata;
}

export interface ProofMetadata {
  /** Timestamp when proof was collected */
  timestamp: string;
  /** ISO timestamp */
  timestampISO: string;
  /** Ad dimensions */
  width: number;
  height: number;
  /** Target DSP */
  dsp: string;
  /** Detected vendor */
  vendor?: string;
  /** Tool version */
  version: string;
  /** Collection duration (ms) */
  collectionDurationMs?: number;
}

export interface ProofPackResult {
  /** The zip blob */
  blob: Blob;
  /** Suggested filename */
  filename: string;
  /** Summary for UI display */
  summary: ProofPackSummary;
}

export interface ProofPackSummary {
  hasScreenshot: boolean;
  hasRecording: boolean;
  complianceStatus: "pass" | "fail" | "warn" | "pending" | "skipped" | "none";
  eventCount: number;
  macroCount: number;
  isPersonalized: boolean;
}

/**
 * Generate a proof pack ZIP file
 */
export async function generateProofPack(
  data: ProofPackData
): Promise<ProofPackResult> {
  const zip = new JSZip();
  const timestamp = Date.now();

  // 1. Add screenshot
  if (data.screenshot) {
    zip.file("screenshot.png", data.screenshot);
  }

  // 2. Add recording
  if (data.recording) {
    const ext = data.recordingFormat === "mp4" ? "mp4" : "webm";
    zip.file(`recording.${ext}`, data.recording);
  }

  // 3. Add compliance results
  if (data.compliance) {
    const complianceJson = JSON.stringify(
      {
        overallStatus: data.compliance.overallStatus,
        checks: data.compliance.checks.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          status: c.status,
          details: c.details,
          items: c.items,
        })),
      },
      null,
      2
    );
    zip.file("compliance.json", complianceJson);
  }

  // 4. Add event log with resolved URLs
  const eventsJson = JSON.stringify(
    data.events.map((e) => {
      const eventData: Record<string, unknown> = {
        type: e.type,
        timestamp: e.timestamp,
        time: new Date(e.timestamp).toISOString(),
      };

      // For click-related events, resolve URLs using macro values
      const clickEvents = ["open", "window.open", "anchor"];
      if (clickEvents.includes(e.type) && e.args?.[0]) {
        const rawUrl = e.args[0] as string;
        let resolvedUrl = rawUrl;

        // Apply macro substitutions if we have macro values
        if (data.macroValues) {
          for (const [macroRaw, value] of Object.entries(data.macroValues)) {
            if (value.trim()) {
              resolvedUrl = resolvedUrl.split(macroRaw).join(value);
            }
          }
        }

        eventData.rawUrl = rawUrl;
        eventData.resolvedUrl = resolvedUrl !== rawUrl ? resolvedUrl : rawUrl;
        // Keep remaining args (e.g., target for window.open)
        if (e.args.length > 1) {
          eventData.args = e.args.slice(1);
        }
      } else {
        eventData.args = e.args;
      }

      return eventData;
    }),
    null,
    2
  );
  zip.file("events.json", eventsJson);

  // 5. Add macros
  if (data.macros.length > 0) {
    const macrosJson = JSON.stringify(
      data.macros.map((m) => ({
        name: m.name,
        format: m.format,
        raw: m.raw,
        count: m.count,
      })),
      null,
      2
    );
    zip.file("macros.json", macrosJson);
  }

  // 5b. Add personalization data
  const hasTextChanges = data.textChanges && data.textChanges.length > 0;
  const hasTagModification = data.modifiedTag && data.modifiedTag !== data.originalTag;
  const hasMacroValues = data.macroValues && Object.values(data.macroValues).some(v => v.trim());

  if (hasTextChanges || hasTagModification || hasMacroValues) {
    const personalizationJson = JSON.stringify(
      {
        tagModified: hasTagModification,
        textChanges: data.textChanges || [],
        macroValues: hasMacroValues ? data.macroValues : undefined,
        summary: {
          textChangesCount: data.textChanges?.length || 0,
          macroValuesApplied: hasMacroValues,
          clickMacroFixApplied: data.clickMacroFixApplied || false,
        },
      },
      null,
      2
    );
    zip.file("personalization.json", personalizationJson);
  }

  // 6. Add original tag
  if (data.originalTag) {
    zip.file("tag-original.html", data.originalTag);
  }

  // 7. Add modified tag (if different)
  if (data.modifiedTag && data.modifiedTag !== data.originalTag) {
    zip.file("tag-modified.html", data.modifiedTag);
  }

  // 8. Add metadata
  const metadataJson = JSON.stringify(data.metadata, null, 2);
  zip.file("metadata.json", metadataJson);

  // 9. Generate summary report (human-readable)
  const report = generateTextReport(data);
  zip.file("qa-report.txt", report);

  // Generate the zip
  const blob = await zip.generateAsync({ type: "blob" });

  // Create summary
  const summary: ProofPackSummary = {
    hasScreenshot: !!data.screenshot,
    hasRecording: !!data.recording,
    complianceStatus: data.compliance?.overallStatus ?? "none",
    eventCount: data.events.length,
    macroCount: data.macros.length,
    isPersonalized: !!(
      data.modifiedTag && data.modifiedTag !== data.originalTag
    ),
  };

  return {
    blob,
    filename: `proof-pack-${data.metadata.width}x${data.metadata.height}-${timestamp}.zip`,
    summary,
  };
}

/**
 * Generate a human-readable text report
 */
function generateTextReport(data: ProofPackData): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("                     DOPPELIST QA PROOF PACK                    ");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(`Generated: ${data.metadata.timestampISO}`);
  lines.push(`Dimensions: ${data.metadata.width}x${data.metadata.height}`);
  lines.push(`Target DSP: ${data.metadata.dsp.toUpperCase()}`);
  if (data.metadata.vendor) {
    lines.push(`Vendor: ${data.metadata.vendor}`);
  }
  lines.push("");

  // Compliance Summary
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("COMPLIANCE SUMMARY");
  lines.push("───────────────────────────────────────────────────────────────");

  if (data.compliance) {
    const statusEmoji =
      data.compliance.overallStatus === "pass"
        ? "✓ PASS"
        : data.compliance.overallStatus === "fail"
        ? "✗ FAIL"
        : data.compliance.overallStatus === "warn"
        ? "⚠ WARN"
        : "? PENDING";

    lines.push(`Overall Status: ${statusEmoji}`);
    lines.push("");

    for (const check of data.compliance.checks) {
      const icon =
        check.status === "pass"
          ? "✓"
          : check.status === "fail"
          ? "✗"
          : check.status === "warn"
          ? "⚠"
          : check.status === "skipped"
          ? "-"
          : "?";
      lines.push(`  ${icon} ${check.name}: ${check.status.toUpperCase()}`);
      if (check.details) {
        lines.push(`    ${check.details}`);
      }
    }
  } else {
    lines.push("No compliance checks run");
  }

  lines.push("");

  // Personalization & Tag Modifications
  const reportHasTextChanges = data.textChanges && data.textChanges.length > 0;
  const reportHasTagMod = data.modifiedTag && data.modifiedTag !== data.originalTag;
  const reportHasMacroValues = data.macroValues && Object.values(data.macroValues).some(v => v.trim());

  if (reportHasTextChanges || reportHasTagMod || reportHasMacroValues || data.clickMacroFixApplied) {
    lines.push("───────────────────────────────────────────────────────────────");
    lines.push("PERSONALIZATION & MODIFICATIONS");
    lines.push("───────────────────────────────────────────────────────────────");

    // Click macro fix (compliance fix)
    if (data.clickMacroFixApplied) {
      lines.push("  ✓ Click macro fix applied (via compliance)");
    }

    // Macro value replacements
    if (reportHasMacroValues && data.macroValues) {
      const filledMacros = Object.entries(data.macroValues).filter(([, v]) => v.trim());
      lines.push(`  ✓ ${filledMacros.length} macro value(s) replaced:`);
      for (const [macroRaw, value] of filledMacros) {
        lines.push(`    • ${macroRaw} → ${value}`);
      }
    }

    // Text personalization
    if (reportHasTextChanges) {
      lines.push(`  ✓ ${data.textChanges!.length} text element(s) personalized:`);
      for (const change of data.textChanges!) {
        const typeLabel = change.type ? ` [${change.type}]` : "";
        lines.push(`    • "${change.original}" → "${change.current}"${typeLabel}`);
      }
    }

    // Tag files
    if (reportHasTagMod) {
      lines.push("");
      lines.push("  Modified tag files:");
      lines.push("    • Original: tag-original.html");
      lines.push("    • Modified: tag-modified.html");
    }

    lines.push("");
  }

  // Macros
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("DETECTED MACROS");
  lines.push("───────────────────────────────────────────────────────────────");

  if (data.macros.length > 0) {
    for (const macro of data.macros) {
      lines.push(`  • ${macro.raw} (${macro.format}, ${macro.count}x)`);
    }
  } else {
    lines.push("No macros detected");
  }

  lines.push("");

  // Events
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("EVENT LOG");
  lines.push("───────────────────────────────────────────────────────────────");

  if (data.events.length > 0) {
    const clickEvents = ["open", "window.open", "anchor"];
    for (const event of data.events.slice(0, 50)) {
      // Limit to 50 events
      const time = new Date(event.timestamp).toLocaleTimeString();

      // For click events, show resolved URL if macro values are available
      if (clickEvents.includes(event.type) && event.args?.[0]) {
        const rawUrl = event.args[0] as string;
        let resolvedUrl = rawUrl;

        if (data.macroValues) {
          for (const [macroRaw, value] of Object.entries(data.macroValues)) {
            if (value.trim()) {
              resolvedUrl = resolvedUrl.split(macroRaw).join(value);
            }
          }
        }

        if (resolvedUrl !== rawUrl) {
          lines.push(`  ${time} | ${event.type}`);
          lines.push(`           raw: ${rawUrl}`);
          lines.push(`           resolved: ${resolvedUrl}`);
        } else {
          lines.push(`  ${time} | ${event.type} → ${rawUrl}`);
        }
      } else {
        const args = event.args?.length ? ` → ${JSON.stringify(event.args)}` : "";
        lines.push(`  ${time} | ${event.type}${args}`);
      }
    }
    if (data.events.length > 50) {
      lines.push(`  ... and ${data.events.length - 50} more events`);
    }
  } else {
    lines.push("No events captured");
  }

  lines.push("");

  // Contents
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("PACKAGE CONTENTS");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("  • qa-report.txt (this file)");
  lines.push("  • metadata.json");
  if (data.screenshot) lines.push("  • screenshot.png");
  if (data.recording)
    lines.push(
      `  • recording.${data.recordingFormat === "mp4" ? "mp4" : "webm"}`
    );
  if (data.compliance) lines.push("  • compliance.json");
  lines.push("  • events.json");
  if (data.macros.length > 0) lines.push("  • macros.json");
  if (reportHasTextChanges || reportHasTagMod || reportHasMacroValues || data.clickMacroFixApplied) {
    lines.push("  • personalization.json");
  }
  if (data.originalTag) lines.push("  • tag-original.html");
  if (reportHasTagMod) {
    lines.push("  • tag-modified.html");
  }

  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push(`                    Doppelist v${data.metadata.version}`);
  lines.push("═══════════════════════════════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Download a proof pack
 */
export function downloadProofPack(result: ProofPackResult): void {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(url);
}

