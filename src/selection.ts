/** One selected item. The URL hash stores this value. */
export type Selection =
  | { kind: "dataset"; name: string }
  | { kind: "metric"; name: string }
  | { kind: "field"; dataset: string; name: string };
