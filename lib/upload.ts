"use client";

import { api, ApiError } from "./api";

export type UploadResult = { key: string; contentType: string; size: number };

/** Browsers sometimes report an empty or generic type; infer from the extension. */
export function contentTypeFor(file: File) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", ogg: "audio/ogg",
    mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", txt: "text/plain",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

/**
 * Upload a file to storage with real progress. The server returns where to
 * PUT it (a signed bucket URL in production, a local endpoint in development).
 */
export function uploadFile(file: File, onProgress: (pct: number) => void, signal?: AbortSignal): Promise<UploadResult> {
  const contentType = contentTypeFor(file);
  return api<{ key: string; url: string; method: "PUT"; headers: Record<string, string> }>("/api/v1/uploads", {
    body: { fileName: file.name, contentType, size: file.size },
  }).then(
    (target) =>
      new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(target.method, target.url);
        for (const [k, v] of Object.entries(target.headers)) xhr.setRequestHeader(k, v);
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.min(99, (e.loaded / e.total) * 100));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve({ key: target.key, contentType, size: file.size });
          } else {
            let msg = `Upload failed (${xhr.status}).`;
            try {
              msg = JSON.parse(xhr.responseText).error ?? msg;
            } catch {}
            reject(new ApiError(xhr.status, msg));
          }
        };
        xhr.onerror = () => reject(new ApiError(0, "Upload failed. Check your connection and try again."));
        xhr.onabort = () => reject(new ApiError(0, "Upload cancelled."));
        signal?.addEventListener("abort", () => xhr.abort());
        xhr.send(file);
      }),
  );
}

/** URL that streams (or downloads) a stored reading or client file. */
export function mediaUrl(kind: "readings" | "files" | "recordings", id: string, download = false) {
  return `/api/v1/media/${kind}/${encodeURIComponent(id)}${download ? "?download=1" : ""}`;
}
