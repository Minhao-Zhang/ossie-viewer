/** One selected item. V3 can read and write this same value from the URL. */
export type Selection =
  | { kind: "dataset"; name: string }
  | { kind: "metric"; name: string }
  | { kind: "field"; dataset: string; name: string };
