import { useMemo } from "react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { DatasetGraph } from "./graph";
import { layoutGraph } from "./layout";

type Props = {
  graph: DatasetGraph;
  selected: string | null;
  onSelect: (datasetName: string) => void;
};

export function GraphView({ graph, selected, onSelect }: Props) {
  const laidOut = useMemo(() => layoutGraph(graph), [graph]);
  const nodes = laidOut.nodes.map((node) => ({
    ...node,
    className: node.id === selected ? "is-selected" : undefined,
  }));

  return (
    <div className="graph">
      <ReactFlow
        nodes={nodes}
        edges={laidOut.edges}
        colorMode="light"
        onNodeClick={(_event, node) => {
          const label = node.data?.label;
          onSelect(typeof label === "string" ? label : node.id);
        }}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      />
    </div>
  );
}
