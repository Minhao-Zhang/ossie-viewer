import { describe, expect, it } from "vitest";

import { buildGraph } from "../src/graph";
import { parseDocument } from "../src/parse";
import { valid011, validYaml } from "./fixtures";

describe("buildGraph", () => {
  it("draws one node per dataset and one edge from the many side to the one side", () => {
    const graph = buildGraph(parseDocument(validYaml));
    expect(graph.nodes).toEqual([
      { id: "orders", name: "orders" },
      { id: "customers", name: "customers" },
    ]);
    expect(graph.edges).toEqual([{ id: "orders_to_customers", source: "orders", target: "customers" }]);
  });

  it("reads datasets nested under a 0.1.1 semantic_model", () => {
    const graph = buildGraph(valid011);
    expect(graph.nodes.map((node) => node.name)).toEqual(["orders", "customers"]);
    expect(graph.edges).toEqual([{ id: "orders_to_customers", source: "orders", target: "customers" }]);
  });

  it("still draws datasets when a field is invalid", () => {
    const graph = buildGraph({
      version: "0.2.0.dev0",
      datasets: [{ name: "orders" }, { name: 4 }, { name: "customers" }],
      relationships: [{ from: "orders", to: "customers" }],
    });
    expect(graph.nodes.map((node) => node.name)).toEqual(["orders", "customers"]);
    expect(graph.edges).toHaveLength(1);
  });
});
