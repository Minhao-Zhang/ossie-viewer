import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { openText } from "../src/document";
import { buildGraph } from "../src/graph";
import { parseDocument } from "../src/parse";

const exampleDirs = [
  "C:\\Users\\zhang\\Code\\ossie\\examples",
  path.resolve(process.cwd(), "../ossie/examples"),
];
const examplesDir = exampleDirs.find((dir) => existsSync(dir)) ?? null;
const governedBi = "C:\\Users\\zhang\\Code\\governed-bi";
const validatePy = "C:\\Users\\zhang\\Code\\ossie\\validation\\validate.py";

function referenceResult(file: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync(
      "uv",
      ["run", "--frozen", "python", validatePy, file],
      { cwd: governedBi, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { ok: true, output };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string; code?: string };
    if (failed.status === undefined) throw error;
    return { ok: false, output: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  }
}

describe("ossie examples", () => {
  if (!examplesDir) {
    it.skip("ossie checkout is absent, so examples/*.yaml were not read", () => {});
    return;
  }

  const files = readdirSync(examplesDir)
    .filter((name) => name.endsWith(".yaml"))
    .map((name) => path.join(examplesDir, name));

  for (const file of files) {
    it(`opens ${path.basename(file)} in step with validate.py`, { timeout: 60_000 }, () => {
      const opened = openText(readFileSync(file, "utf8"));
      expect(opened.parseError).toBeNull();
      const reference = referenceResult(file);
      if (reference.ok) expect(opened.issues).toEqual([]);
      if (opened.issues.length > 0) {
        expect(reference.ok, reference.output).toBe(false);
      }
    });
  }

  it("builds one node per dataset and one edge per relationship for tpcds", () => {
    const file = path.join(examplesDir, "tpcds_semantic_model.yaml");
    const data = parseDocument(readFileSync(file, "utf8")) as {
      datasets: { name: string }[];
      relationships: { from: string; to: string }[];
    };
    const graph = buildGraph(data);
    expect(graph.nodes.map((node) => node.name)).toEqual(data.datasets.map((dataset) => dataset.name));
    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual(
      data.relationships.map((relationship) => [relationship.from, relationship.to]),
    );
  });
});
