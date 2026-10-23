export type DialectExpression = { dialect: string; expression: string };

export type Extension =
  | { vendor: string; kind: "json"; value: unknown }
  | { vendor: string; kind: "text"; text: string; note: string };

export type Field = {
  name: string;
  expressions: DialectExpression[];
  datatype: string | null;
  description: string | null;
  aiContext: unknown;
  extensions: Extension[];
};

export type Dataset = {
  name: string;
  source: string | null;
  description: string | null;
  primaryKey: string[];
  uniqueKeys: string[][];
  aiContext: unknown;
  fields: Field[];
  extensions: Extension[];
};

export type Relationship = {
  name: string;
  from: string;
  to: string;
  fromColumns: string[];
  toColumns: string[];
  aiContext: unknown;
  extensions: Extension[];
};

export type FieldRef = { dataset: string; field: string };

export type Metric = {
  name: string;
  description: string | null;
  expressions: DialectExpression[];
  aiContext: unknown;
  extensions: Extension[];
  references: FieldRef[];
};

export type SemanticModel = {
  name: string | null;
  description: string | null;
  aiContext: unknown;
  datasets: Dataset[];
  relationships: Relationship[];
  metrics: Metric[];
  extensions: Extension[];
};

const NON_JSON = "This value is not JSON, so it is shown as text.";

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function stringLists(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value.map(strings).filter((items) => items.length > 0);
}

export function emptyModel(): SemanticModel {
  return {
    name: null,
    description: null,
    aiContext: null,
    datasets: [],
    relationships: [],
    metrics: [],
    extensions: [],
  };
}

function modelRecords(doc: Record<string, unknown>): Record<string, unknown>[] {
  const nested: Record<string, unknown>[] = [];
  if (Array.isArray(doc.semantic_model)) {
    for (const item of doc.semantic_model) {
      const model = record(item);
      if (model) nested.push(model);
    }
  }
  const rootIsModel =
    Array.isArray(doc.datasets) ||
    Array.isArray(doc.relationships) ||
    Array.isArray(doc.metrics) ||
    (typeof doc.name === "string" && nested.length === 0);
  return rootIsModel ? [doc, ...nested] : nested;
}

function readExtension(value: unknown): Extension | null {
  const row = record(value);
  const vendor = text(row?.vendor_name);
  if (!row || !vendor) return null;
  const data = row.data;
  if (typeof data === "string") {
    try {
      return { vendor, kind: "json", value: JSON.parse(data) };
    } catch {
      return { vendor, kind: "text", text: data, note: NON_JSON };
    }
  }
  if (typeof data === "object" && data !== null) return { vendor, kind: "json", value: data };
  return { vendor, kind: "text", text: data == null ? "" : String(data), note: NON_JSON };
}

function extensionsOf(value: unknown): Extension[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const extension = readExtension(item);
    return extension ? [extension] : [];
  });
}

function expressionsOf(value: unknown): DialectExpression[] {
  const expression = record(value);
  if (!expression || !Array.isArray(expression.dialects)) return [];
  const expressions: DialectExpression[] = [];
  for (const item of expression.dialects) {
    const row = record(item);
    const sql = text(row?.expression);
    if (!row || sql === null) continue;
    expressions.push({ dialect: text(row.dialect) ?? "expression", expression: sql });
  }
  return expressions;
}

function readField(value: unknown): Field | null {
  const row = record(value);
  const name = text(row?.name);
  if (!row || !name) return null;
  return {
    name,
    expressions: expressionsOf(row.expression),
    datatype: text(row.datatype),
    description: text(row.description),
    aiContext: row.ai_context ?? null,
    extensions: extensionsOf(row.custom_extensions),
  };
}

function readDataset(value: unknown): Dataset | null {
  const row = record(value);
  const name = text(row?.name);
  if (!row || !name) return null;
  const fields = Array.isArray(row.fields) ? row.fields.flatMap((item) => {
    const field = readField(item);
    return field ? [field] : [];
  }) : [];
  return {
    name,
    source: text(row.source),
    description: text(row.description),
    primaryKey: strings(row.primary_key),
    uniqueKeys: stringLists(row.unique_keys),
    aiContext: row.ai_context ?? null,
    fields,
    extensions: extensionsOf(row.custom_extensions),
  };
}

function readRelationship(value: unknown): Relationship | null {
  const row = record(value);
  const from = text(row?.from);
  const to = text(row?.to);
  if (!row || !from || !to) return null;
  return {
    name: text(row.name) ?? "relationship",
    from,
    to,
    fromColumns: strings(row.from_columns),
    toColumns: strings(row.to_columns),
    aiContext: row.ai_context ?? null,
    extensions: extensionsOf(row.custom_extensions),
  };
}

function readMetric(value: unknown): Omit<Metric, "references"> | null {
  const row = record(value);
  const name = text(row?.name);
  if (!row || !name) return null;
  return {
    name,
    description: text(row.description),
    expressions: expressionsOf(row.expression),
    aiContext: row.ai_context ?? null,
    extensions: extensionsOf(row.custom_extensions),
  };
}

function readPart(raw: Record<string, unknown>): SemanticModel {
  return {
    name: text(raw.name),
    description: text(raw.description),
    aiContext: raw.ai_context ?? null,
    datasets: Array.isArray(raw.datasets) ? raw.datasets.flatMap((item) => {
      const dataset = readDataset(item);
      return dataset ? [dataset] : [];
    }) : [],
    relationships: Array.isArray(raw.relationships) ? raw.relationships.flatMap((item) => {
      const relationship = readRelationship(item);
      return relationship ? [relationship] : [];
    }) : [],
    metrics: [],
    extensions: extensionsOf(raw.custom_extensions),
  };
}

function maskStrings(expression: string): string {
  return expression.replace(/'(?:''|[^'])*'/g, (match) => " ".repeat(match.length));
}

function pairs(expression: string): FieldRef[] {
  const textValue = maskStrings(expression);
  const tokens: { value: string; start: number; end: number }[] = [];
  for (const match of textValue.matchAll(/"((?:[^"]|"")*)"|[\p{L}_][\p{L}\p{N}_$]*/gu)) {
    const quoted = match[1];
    const start = match.index ?? 0;
    tokens.push({
      value: quoted === undefined ? match[0] : quoted.replaceAll('""', '"'),
      start,
      end: start + match[0].length,
    });
  }
  const refs: FieldRef[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const between = textValue.slice(tokens[i].end, tokens[i + 1].start);
    if (!/^\s*\.\s*$/.test(between)) continue;
    refs.push({ dataset: tokens[i].value, field: tokens[i + 1].value });
  }
  return refs;
}

/** The schema stores no reference list. A reference is a dataset.field token that exists in the model. */
export function fieldReferences(expressions: string[], datasets: Dataset[]): FieldRef[] {
  const fields = new Map<string, Set<string>>();
  for (const dataset of datasets) {
    const names = fields.get(dataset.name) ?? new Set<string>();
    for (const field of dataset.fields) names.add(field.name);
    fields.set(dataset.name, names);
  }
  const found: FieldRef[] = [];
  const seen = new Set<string>();
  for (const expression of expressions) {
    for (const ref of pairs(expression)) {
      if (!fields.get(ref.dataset)?.has(ref.field)) continue;
      const key = `${ref.dataset}\0${ref.field}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(ref);
    }
  }
  return found;
}

export function readModel(doc: unknown): SemanticModel {
  const root = record(doc);
  if (!root) return emptyModel();
  const raws = modelRecords(root);
  if (raws.length === 0) return emptyModel();
  // A 0.1.1 file may list several semantic models. They are shown as one catalogue.
  const parts = raws.map(readPart);
  const datasets = parts.flatMap((part) => part.datasets);
  const metrics = raws.flatMap((raw) =>
    Array.isArray(raw.metrics) ? raw.metrics.flatMap((item) => {
      const metric = readMetric(item);
      return metric ? [metric] : [];
    }) : [],
  );
  return {
    name: parts.map((part) => part.name).filter((name): name is string => name !== null).join(", ") || null,
    description: parts.find((part) => part.description)?.description ?? null,
    aiContext: parts.find((part) => part.aiContext != null)?.aiContext ?? null,
    datasets,
    relationships: parts.flatMap((part) => part.relationships),
    metrics: metrics.map((metric) => ({
      ...metric,
      references: fieldReferences(metric.expressions.map((item) => item.expression), datasets),
    })),
    extensions: parts.flatMap((part) => part.extensions),
  };
}
