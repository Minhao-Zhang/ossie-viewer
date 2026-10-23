import { buildGraph, type DatasetGraph } from "./graph";
import { emptyModel, readModel, type SemanticModel } from "./model";
import { parseDocument } from "./parse";
import { inspect, type Inspection } from "./validate";

export type OpenedDocument = Inspection & {
  graph: DatasetGraph;
  model: SemanticModel;
  parseError: string | null;
};

export function openText(text: string): OpenedDocument {
  let data: unknown;
  try {
    data = parseDocument(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The parser failed.";
    return {
      version: null,
      schema: null,
      issues: [],
      graph: { nodes: [], edges: [] },
      model: emptyModel(),
      parseError: `Could not read this file as YAML or JSON. ${detail}`,
    };
  }
  return { ...inspect(data), graph: buildGraph(data), model: readModel(data), parseError: null };
}
