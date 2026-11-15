"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** JSON fetch against our own API. Throws ApiError with the server's message. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; keepalive?: boolean; headers?: Record<string, string> } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
      headers: { ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }), ...(opts.headers ?? {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "same-origin",
      cache: "no-store",
      keepalive: opts.keepalive,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status}).`, data.details);
  return data as T;
}
