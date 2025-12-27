/**
 * Zip Export
 *
 * Creates zip files from batch capture results.
 *
 * TODO: Phase 2 implementation
 * - Use JSZip for client-side zip creation
 * - Organize files in folder structure
 * - Generate and download zip
 */

export interface ZipEntry {
  filename: string;
  blob: Blob;
}

/**
 * Creates a zip file from multiple entries
 */
export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  // Placeholder
  throw new Error("Zip export not yet implemented");
}

/**
 * Triggers download of a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
