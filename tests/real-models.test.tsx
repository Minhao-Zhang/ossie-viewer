import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DatasetView } from "../src/DatasetView";
import { MetricView } from "../src/MetricView";
import { openText } from "../src/document";
import type { Extension, SemanticModel } from "../src/model";

const exampleDirs = [
  "C:\\Users\\zhang\\Code\\ossie\\examples",
  path.resolve(process.cwd(), "../ossie/examples"),
];
const examplesDir = exampleDirs.find((dir) => existsSync(dir)) ?? null;

const birdRoots = [
  "C:\\Users\\zhang\\Code\\BIRD-corpus",
  path.resolve(process.cwd(), "../BIRD-corpus"),
];
const birdRoot = birdRoots.find((dir) => existsSync(dir)) ?? null;
// BIRD-corpus is stored as Ossie: one model per database, at <database>/<database>.yaml.
const birdFiles = birdRoot
  ? readdirSync(birdRoot)
      .filter((name) => existsSync(path.join(birdRoot, name, `${name}.yaml`)))
      .sort()
      .map((name) => path.join(birdRoot, name, `${name}.yaml`))
  : [];

afterEach(cleanup);

function nonJson(model: SemanticModel): string[] {
  const extensions: Extension[] = [
    ...model.extensions,
    ...model.datasets.flatMap((dataset) => [
      ...dataset.extensions,
      ...dataset.fields.flatMap((field) => field.extensions),
    ]),
    ...model.relationships.flatMap((relationship) => relationship.extensions),
    ...model.metrics.flatMap((metric) => metric.extensions),
  ];
  return extensions.filter((extension) => extension.kind === "text").map((extension) => extension.vendor);
}

function renders(model: SemanticModel) {
  for (const dataset of model.datasets) {
    const view = render(
      <DatasetView dataset={dataset} relationships={model.relationships} metrics={model.metrics} highlight={null} onSelect={() => {}} />,
    );
    expect(screen.getByRole("heading", { name: dataset.name })).toBeTruthy();
    view.unmount();
  }
  for (const metric of model.metrics) {
    const view = render(<MetricView metric={metric} onSelect={() => {}} />);
    expect(screen.getByRole("heading", { name: metric.name })).toBeTruthy();
    view.unmount();
  }
}

describe("real models", () => {
  const tpcds = examplesDir ? path.join(examplesDir, "tpcds_semantic_model.yaml") : null;

  it.skipIf(!tpcds || !existsSync(tpcds))(
    tpcds ? "renders every TPC-DS dataset and metric" : "renders TPC-DS — skipped because the ossie examples are absent",
    () => {
      const opened = openText(readFileSync(tpcds!, "utf8"));
      expect(opened.parseError).toBeNull();
      expect(nonJson(opened.model)).toEqual([]);
      const lifetime = opened.model.metrics.find((metric) => metric.name === "customer_lifetime_value");
      expect(lifetime?.references).toEqual([
        { dataset: "store_sales", field: "ss_ext_sales_price" },
        { dataset: "customer", field: "c_customer_sk" },
      ]);
      renders(opened.model);
    },
  );

  it.skipIf(birdFiles.length === 0)(
    birdFiles.length
      ? `opens all ${birdFiles.length} BIRD models with no issue and renders every dataset and metric`
      : "opens the BIRD models — skipped because ../BIRD-corpus is absent",
    () => {
      expect(birdFiles.length).toBe(57);
      for (const file of birdFiles) {
        const opened = openText(readFileSync(file, "utf8"));
        expect(opened.parseError, file).toBeNull();
        expect(opened.version, file).toBe("0.2.0.dev0");
        expect(opened.issues, file).toEqual([]);
        expect(nonJson(opened.model), file).toEqual([]);
        renders(opened.model);
      }
    },
    600_000,
  );

  it.skipIf(birdFiles.length === 0)("opens and lays out the largest BIRD model quickly enough to use", () => {
    const largest = [...birdFiles].sort((a, b) => readFileSync(b).length - readFileSync(a).length)[0]!;
    const started = performance.now();
    const opened = openText(readFileSync(largest, "utf8"));
    const elapsed = performance.now() - started;
    expect(opened.graph.nodes.length).toBeGreaterThan(0);
    expect(elapsed, `${path.basename(largest)} took ${Math.round(elapsed)} ms`).toBeLessThan(3000);
  });
});
