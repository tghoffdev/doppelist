/**
 * Zip Export Utility
 *
 * Creates zip archives from batch capture results.
 */

import JSZip from "jszip";

export interface ZipFile {
  filename: string;
  blob: Blob;
}

/**
 * Create a zip archive from multiple files
 */
export async function createZipArchive(files: ZipFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.blob);
  }

  return zip.generateAsync({ type: "blob" });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
