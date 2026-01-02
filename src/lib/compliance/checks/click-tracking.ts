/**
 * Click Tracking Compliance Checks
 */

import type { ClickInfo, ComplianceCheck } from "../types";
import type { DSPRules } from "../rules";

export function runClickTrackingChecks(
  clicks: ClickInfo[],
  sourceContent: string | undefined,
  rules: DSPRules
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Check for click macro presence in source
  let foundMacros: string[] = [];

  if (sourceContent) {
    for (const pattern of rules.clickMacroPatterns) {
      if (sourceContent.includes(pattern)) {
        foundMacros.push(pattern);
      }
    }

    // Also check for common clickTag patterns (var clickTag, window.clickTag, clickTAG)
    if (/(?:var|let|const|window\.)\s*clickTag|clickTAG/i.test(sourceContent)) {
      foundMacros.push("clickTag");
    }
  }

  // Deduplicate
  foundMacros = [...new Set(foundMacros)];

  if (foundMacros.length > 0) {
    checks.push({
      id: "click-macro",
      category: "click-tracking",
      name: "Click Macro",
      description: "Click tracking macro must be present",
      status: "pass",
      details: `Found: ${foundMacros.join(", ")}`,
      items: foundMacros.map((m) => ({
        label: m,
        value: "present",
        status: "pass",
      })),
    });
  } else if (rules.requireClickMacro) {
    checks.push({
      id: "click-macro",
      category: "click-tracking",
      name: "Click Macro",
      description: "Click tracking macro must be present",
      status: "fail",
      details: `Expected one of: ${rules.clickMacroPatterns.slice(0, 3).join(", ")}`,
    });
  } else {
    checks.push({
      id: "click-macro",
      category: "click-tracking",
      name: "Click Macro",
      description: "Click tracking macro recommended",
      status: "warn",
      details: "No click macro detected (not required for this DSP)",
    });
  }

  // Note: Click events are tracked in the MRAID event log, not as a compliance check
  // since they depend on user interaction during preview

  return checks;
}
