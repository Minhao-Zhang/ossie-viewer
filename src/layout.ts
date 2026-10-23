import { graphlib, layout } from "@dagrejs/dagre";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";

import type { DatasetGraph } from "./graph";

const NODE_HEIGHT = 36;

function nodeWidth(name: string): number {
  return Math.max(96, Math.min(320, name.length * 8 + 28));
}

/** Left to right, so the many side is drawn to the left of the one side. */
export function layoutGraph(graph: DatasetGraph): { nodes: Node[]; edges: Edge[] } {
  const g = new graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 28, ranksep: 72 });

  for (const node of graph.nodes) {
    g.setNode(node.id, { width: nodeWidth(node.name), height: NODE_HEIGHT });
  }
  for (const edge of graph.edges) {
    g.setEdge(edge.source, edge.target);
  }
  layout(g);

  const nodes: Node[] = graph.nodes.map((node) => {
    const placed = g.node(node.id);
    const width = nodeWidth(node.name);
    return {
      id: node.id,
      data: { label: node.name },
      position: { x: placed.x - width / 2, y: placed.y - NODE_HEIGHT / 2 },
      initialWidth: width,
      initialHeight: NODE_HEIGHT,
      // Declared handles let the edge draw before the browser measures the node.
      handles: [
        { type: "target", position: Position.Left, x: 0, y: NODE_HEIGHT / 2 },
        { type: "source", position: Position.Right, x: width, y: NODE_HEIGHT / 2 },
      ],
      style: { width, height: NODE_HEIGHT },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#0d0d0d" },
    style: { stroke: "#0d0d0d" },
  }));

  return { nodes, edges };
}
