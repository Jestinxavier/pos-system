const enabled = import.meta.env.DEV || import.meta.env.VITE_DEBUG_FLOW === "true";

export function flowLog(event: string, details?: unknown) {
  if (!enabled) return;
  const ts = new Date().toISOString();
  if (details === undefined) {
    console.log(`[FLOW ${ts}] ${event}`);
    return;
  }
  console.log(`[FLOW ${ts}] ${event}`, details);
}

export function flowError(event: string, error: unknown) {
  if (!enabled) return;
  const ts = new Date().toISOString();
  console.error(`[FLOW ${ts}] ${event}`, error);
}
