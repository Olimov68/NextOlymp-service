/**
 * Safely normalize API response data into an array.
 * Handles all backend response formats:
 *   - Direct array: [...]
 *   - Standard: { data: [...] }
 *   - Nested pagination: { data: { data: [...], page, total } }
 *   - Items wrapper: { items: [...] }
 *   - Double nested items: { data: { items: [...] } }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeList<T = any>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    // Handle nested: { data: { data: [...], page, total } }
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
      if (Array.isArray(inner.items)) return inner.items as T[];
    }
  }
  return [];
}
