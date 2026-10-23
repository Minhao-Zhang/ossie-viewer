export type DatasetNode = { id: string; name: string };

/** `source` is the many side (`from`); `target` is the one side (`to`). */
export type RelationshipEdge = { id: string; source: string; target: string };

export type DatasetGraph = { nodes: DatasetNode[]; edges: RelationshipEdge[] };

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function modelsOf(doc: Record<string, unknown>): Record<string, unknown>[] {
  const models: Record<string, unknown>[] = [];
  if (Array.isArray(doc.datasets) || Array.isArray(doc.relationships)) models.push(doc);
  if (Array.isArray(doc.semantic_model)) {
    for (const item of doc.semantic_model) {
      const model = record(item);
      if (model) models.push(model);
    }
  }
  return models;
}

function uniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let n = 2;
  while (used.has(`${base} (${n})`)) n += 1;
  const id = `${base} (${n})`;
  used.add(id);
  return id;
}

export function buildGraph(doc: unknown): DatasetGraph {
  const root = record(doc);
  if (!root) return { nodes: [], edges: [] };

  const nodes: DatasetNode[] = [];
  const nodeIds = new Set<string>();
  const idByName = new Map<string, string>();
  const relationships: { name: string; from: string; to: string }[] = [];

  for (const model of modelsOf(root)) {
    if (Array.isArray(model.datasets)) {
      for (const item of model.datasets) {
        const dataset = record(item);
        const name = dataset?.name;
        if (typeof name !== "string" || name.length === 0) continue;
        const id = uniqueId(name, nodeIds);
        if (!idByName.has(name)) idByName.set(name, id);
        nodes.push({ id, name });
      }
    }
    if (Array.isArray(model.relationships)) {
      for (const item of model.relationships) {
        const relationship = record(item);
        if (!relationship) continue;
        if (typeof relationship.from !== "string" || typeof relationship.to !== "string") continue;
        const name =
          typeof relationship.name === "string" && relationship.name.length > 0
            ? relationship.name
            : "relationship";
        relationships.push({ name, from: relationship.from, to: relationship.to });
      }
    }
  }

  const edgeIds = new Set<string>();
  const edges: RelationshipEdge[] = [];
  for (const relationship of relationships) {
    const source = idByName.get(relationship.from);
    const target = idByName.get(relationship.to);
    if (!source || !target) continue;
    edges.push({
      id: uniqueId(relationship.name, edgeIds),
      source,
      target,
    });
  }

  return { nodes, edges };
}
