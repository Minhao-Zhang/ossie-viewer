import { parse } from "yaml";

/** YAML 1.2, which also accepts JSON. */
export function parseDocument(text: string): unknown {
  return parse(text);
}
