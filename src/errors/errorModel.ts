export type PageErrorKind = "not-found" | "server" | "network";

export function classifyPageError(error: unknown, online = true): PageErrorKind {
  const detail = error && typeof error === "object" ? error as { status?: unknown; name?: unknown; message?: unknown } : {};
  if (detail.status === 404) return "not-found";
  if (typeof detail.status === "number" && detail.status >= 500) return "server";
  const failedLoad = typeof detail.message === "string" && /failed to fetch|networkerror|load failed|importing a module script failed|error loading dynamically imported module/i.test(detail.message);
  if (detail.name === "NetworkError" || (!online && failedLoad)) return "network";
  // An import failure can be a server response, not proof of lost connectivity.
  return "server";
}

export function errorDiagnostic(error: unknown, componentStack?: string | null) {
  const detail = error && typeof error === "object" ? error as { status?: unknown; name?: unknown } : {};
  const names = ["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "NetworkError"];
  return {
    type: typeof detail.name === "string" && names.includes(detail.name) ? detail.name : "Error",
    status: typeof detail.status === "number" && Number.isInteger(detail.status) && detail.status >= 400 && detail.status < 600 ? detail.status : undefined,
    components: [...(componentStack ?? "").matchAll(/at ([A-Za-z_$][\w$]*)/g)].map(match => match[1]).slice(0, 12),
  };
}

export function reportPageError(error: unknown, info: { componentStack?: string | null }) {
  // Never log arbitrary messages, URLs, props, addresses or payment details.
  console.error("[Alibaba] Frontend error", errorDiagnostic(error, info.componentStack));
}
