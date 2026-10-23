import { existsSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
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

const birdDirs = [
  "C:\\Users\\zhang\\Code\\governed-bi\\runs\\p15\\bird",
  path.resolve(process.cwd(), "../governed-bi/runs/p15/bird"),
  path.join(os.tmpdir(), "ossie-viewer-bird"),
];
const birdDir = birdDirs.find((dir) => existsSync(dir)) ?? null;
const birdFile = birdDir
  ? readdirSync(birdDir)
      .filter((name) => name !== "export-report.json" && (name.endsWith(".yaml") || name.endsWith(".yml") || name.endsWith(".json")))
      .sort()[0]
  : undefined;

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

  it.skipIf(!birdFile)(
    birdFile
      ? `renders every dataset and metric in ${birdFile}`
      : "renders an exported BIRD model — skipped because runs/p15/bird and the temp export are absent",
    () => {
      const opened = openText(readFileSync(path.join(birdDir!, birdFile!), "utf8"));
      expect(opened.parseError).toBeNull();
      expect(nonJson(opened.model)).toEqual([]);
      renders(opened.model);
    },
  );
});
