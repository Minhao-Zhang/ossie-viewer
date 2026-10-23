import type { ReactNode } from "react";

import { jsonText } from "./jsonText";

const FIRST = ["instructions", "synonyms", "examples"];

export function hasAiContext(value: unknown): boolean {
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(present);
  }
  return value != null;
}

function present(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(present);
  return true;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function orderedKeys(value: Record<string, unknown>): string[] {
  const first = FIRST.filter((key) => key in value);
  const rest = Object.keys(value).filter((key) => !first.includes(key));
  return [...first, ...rest];
}

function ContextValue({ value }: { value: unknown }): ReactNode {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isStringList(value)) return value.join(", ");
  const printed = jsonText(value);
  return printed === null ? String(value) : <pre>{printed}</pre>;
}

export function AiContextView({ value }: { value: unknown }) {
  if (!hasAiContext(value)) return null;
  if (typeof value === "string") return <p className="context-text">{value}</p>;
  if (typeof value !== "object" || Array.isArray(value)) {
    const printed = jsonText(value);
    return printed === null ? <p>{String(value)}</p> : <pre>{printed}</pre>;
  }
  const record = value as Record<string, unknown>;
  const keys = orderedKeys(record).filter((key) => present(record[key]));
  return (
    <dl className="context">
      {keys.map((key) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>
            <ContextValue value={record[key]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
