export function jsonText(value: unknown): string | null {
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    return null;
  }
}
