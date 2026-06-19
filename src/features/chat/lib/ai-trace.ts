export type AiTraceKind = "chat" | "recommendation";

export interface AiTraceEvent {
  at: string;
  stage: string;
  data: unknown;
}

export interface AiTrace {
  id: string;
  kind: AiTraceKind;
  userId: string | null;
  startedAt: string;
  events: AiTraceEvent[];
}

const MAX_TRACES = 100;
const MAX_EVENTS_PER_TRACE = 30;

declare global {
  var aiTraceStore: Map<string, AiTrace> | undefined;
}

const traceStore = globalThis.aiTraceStore ?? new Map<string, AiTrace>();
if (process.env.NODE_ENV !== "production") globalThis.aiTraceStore = traceStore;

export function isAiTraceEnabled() {
  return process.env.AI_TRACE_ENABLED === "true";
}

export function createAiTrace(kind: AiTraceKind, userId: string | null) {
  const id = crypto.randomUUID();
  if (!isAiTraceEnabled()) return id;

  traceStore.set(id, {
    id,
    kind,
    userId,
    startedAt: new Date().toISOString(),
    events: [],
  });
  trimTraceStore();
  return id;
}

export function appendAiTrace(traceId: string, stage: string, data: unknown) {
  if (!isAiTraceEnabled()) return;
  const trace = traceStore.get(traceId);
  if (!trace) return;

  trace.events.push({
    at: new Date().toISOString(),
    stage,
    data: sanitize(data),
  });
  if (trace.events.length > MAX_EVENTS_PER_TRACE) trace.events.shift();
}

export function getAiTracesForUser(userId: string, limit = 10) {
  if (!isAiTraceEnabled()) return [];
  return [...traceStore.values()]
    .filter((trace) => trace.userId === userId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") return sanitizeText(value).slice(0, 5_000);
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitize(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      /api.?key|secret|tokens?$|cookie|password|authorization|otp/i.test(key)
        ? "[redacted]"
        : sanitize(item, depth + 1),
    ]),
  );
}

function sanitizeText(value: string) {
  return value
    .replace(/(?:sk-|Bearer\s+)[A-Za-z0-9._-]{12,}/gi, "[redacted-secret]")
    .replace(/\b\d{6}\b/g, "[redacted-code]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted-card]");
}

function trimTraceStore() {
  while (traceStore.size > MAX_TRACES) {
    const oldestKey = traceStore.keys().next().value as string | undefined;
    if (!oldestKey) return;
    traceStore.delete(oldestKey);
  }
}
