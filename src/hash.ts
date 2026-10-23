import type { SemanticModel } from "./model";
import type { Selection } from "./selection";

// A dot in a name is encoded as %2E so the raw "." in #field/ stays the separator.
function encodeName(value: string): string {
  return encodeURIComponent(value).replaceAll(".", "%2E");
}

function decodeName(value: string): string | null {
  if (value.length === 0) return null;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

function fragmentLabel(fragment: string): string {
  try {
    const decoded = decodeURIComponent(fragment);
    return decoded.length > 0 ? decoded : fragment;
  } catch {
    return fragment;
  }
}

export type ParsedHash =
  | { kind: "overview" }
  | { kind: "item"; selection: Selection; label: string }
  | { kind: "bad"; label: string };

export function selectionHash(selection: Selection): string {
  if (selection.kind === "dataset") return `#dataset/${encodeName(selection.name)}`;
  if (selection.kind === "metric") return `#metric/${encodeName(selection.name)}`;
  return `#field/${encodeName(selection.dataset)}.${encodeName(selection.name)}`;
}

export function parseHash(hash: string): ParsedHash {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (fragment.length === 0) return { kind: "overview" };

  const slash = fragment.indexOf("/");
  if (slash <= 0) return { kind: "bad", label: fragmentLabel(fragment) };
  const kind = fragment.slice(0, slash);
  const rest = fragment.slice(slash + 1);

  if (kind === "dataset" || kind === "metric") {
    const name = decodeName(rest);
    if (!name) return { kind: "bad", label: fragmentLabel(fragment) };
    const selection: Selection = kind === "dataset" ? { kind: "dataset", name } : { kind: "metric", name };
    return { kind: "item", selection, label: name };
  }

  if (kind === "field") {
    const dot = rest.indexOf(".");
    if (dot <= 0 || dot === rest.length - 1) return { kind: "bad", label: fragmentLabel(fragment) };
    const dataset = decodeName(rest.slice(0, dot));
    const name = decodeName(rest.slice(dot + 1));
    if (!dataset || !name) return { kind: "bad", label: fragmentLabel(fragment) };
    return { kind: "item", selection: { kind: "field", dataset, name }, label: `${dataset}.${name}` };
  }

  return { kind: "bad", label: fragmentLabel(fragment) };
}

function sameSelection(a: Selection, b: Selection): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "field" && b.kind === "field") return a.dataset === b.dataset && a.name === b.name;
  return a.kind !== "field" && b.kind !== "field" && a.name === b.name;
}

export function sameTarget(hash: string, selection: Selection | null): boolean {
  const parsed = parseHash(hash);
  if (selection === null) return parsed.kind === "overview";
  return parsed.kind === "item" && sameSelection(parsed.selection, selection);
}

function present(model: SemanticModel, selection: Selection): boolean {
  if (selection.kind === "dataset") return model.datasets.some((dataset) => dataset.name === selection.name);
  if (selection.kind === "metric") return model.metrics.some((metric) => metric.name === selection.name);
  const dataset = model.datasets.find((item) => item.name === selection.dataset);
  return dataset?.fields.some((field) => field.name === selection.name) ?? false;
}

export function resolveHash(
  model: SemanticModel,
  hash: string,
): { selection: Selection | null; notFound: string | null } {
  const parsed = parseHash(hash);
  if (parsed.kind === "overview") return { selection: null, notFound: null };
  if (parsed.kind === "bad" || !present(model, parsed.selection)) {
    return { selection: null, notFound: parsed.label };
  }
  return { selection: parsed.selection, notFound: null };
}

export function readLocationHash(): string {
  const href = window.location.href;
  const index = href.indexOf("#");
  return index === -1 ? "" : href.slice(index);
}

export function writeLocationHash(hash: string): void {
  if (hash === "") {
    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = hash;
}

export type CopiedLink = { text: string; local: boolean };

export function linkToCopy(selection: Selection, fileUrl: string | null): CopiedLink {
  const hash = selectionHash(selection);
  if (!fileUrl) return { text: hash, local: true };
  const url = new URL(window.location.href);
  url.searchParams.set("file", fileUrl);
  url.hash = hash;
  return { text: url.href, local: false };
}
