import { safeFileName } from "@/lib/payload-files";

/** Hand bytes to the browser as a file download. Nothing is sent anywhere. */
export function downloadBytes(fileName: string, data: Uint8Array, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([data as unknown as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(fileName);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
