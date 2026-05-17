export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiFetchInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  input: string,
  init: ApiFetchInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const hasJsonBody = init.body !== undefined;

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
    body: hasJsonBody ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const rawText = await response.text();
  let payload: unknown = null;

  if (isJson && rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = null;
    }
  }

  const payloadError =
    payload && typeof payload === "object" && "error" in payload
      ? payload.error
      : undefined;

  if (!response.ok) {
    const fallbackMessage =
      (typeof payloadError === "string" ? payloadError : undefined) ||
      rawText.trim() ||
      `Request failed with status ${response.status}`;

    throw new ApiError(
      fallbackMessage,
      response.status,
      payload ?? rawText,
    );
  }

  if (!rawText) {
    return null as T;
  }

  return (payload ?? rawText) as T;
}
