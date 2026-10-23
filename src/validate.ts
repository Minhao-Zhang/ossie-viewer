import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject, Schema } from "ajv";

import schema011 from "./schemas/osi-0.1.1.schema.json";
import schema020 from "./schemas/ossie-0.2.0.dev0.schema.json";

export const KNOWN_VERSIONS = ["0.2.0.dev0", "0.1.1"] as const;

export type KnownVersion = (typeof KNOWN_VERSIONS)[number];

export type Issue = { path: string; message: string };

export type Inspection = {
  version: string | null;
  schema: KnownVersion | null;
  issues: Issue[];
};

const ajv = new Ajv2020({ allErrors: true, strict: false });

const validateByVersion: Record<KnownVersion, ReturnType<typeof ajv.compile>> = {
  "0.2.0.dev0": ajv.compile(schema020 as Schema),
  "0.1.1": ajv.compile(schema011 as Schema),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnown(version: string): version is KnownVersion {
  return (KNOWN_VERSIONS as readonly string[]).includes(version);
}

function knownVersionsText(): string {
  return KNOWN_VERSIONS.join(" and ");
}

function pointerToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

/** A missing or extra property is named on the path, not only in the message. */
function issuePath(error: ErrorObject): string {
  const params = error.params as { missingProperty?: unknown; additionalProperty?: unknown };
  let token: string | null = null;
  if (error.keyword === "required" && typeof params.missingProperty === "string") {
    token = params.missingProperty;
  } else if (error.keyword === "additionalProperties" && typeof params.additionalProperty === "string") {
    token = params.additionalProperty;
  }
  const extra = token ? `/${pointerToken(token)}` : "";
  return `${error.instancePath}${extra}` || "/";
}

export function inspect(data: unknown): Inspection {
  if (!isRecord(data)) {
    return {
      version: null,
      schema: null,
      issues: [
        {
          path: "/",
          message: "This file is not an Ossie document: the top level is not an object.",
        },
      ],
    };
  }

  const raw = data.version;
  if (typeof raw !== "string" || raw.length === 0) {
    return {
      version: null,
      schema: null,
      issues: [
        {
          path: "/version",
          message: `This document has no version. This viewer knows ${knownVersionsText()}.`,
        },
      ],
    };
  }

  if (!isKnown(raw)) {
    return {
      version: raw,
      schema: null,
      issues: [
        {
          path: "/version",
          message: `Unknown version "${raw}". This viewer knows ${knownVersionsText()}.`,
        },
      ],
    };
  }

  const validate = validateByVersion[raw];
  validate(data);
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const error of validate.errors ?? []) {
    const path = issuePath(error);
    const message = error.message ?? error.keyword;
    const key = `${path}\0${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({ path, message });
  }
  return { version: raw, schema: raw, issues };
}
