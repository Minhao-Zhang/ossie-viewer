import { describe, expect, it } from "vitest";

import { fieldReferences, readModel } from "../src/model";
import { parseDocument } from "../src/parse";
import { detailYaml, valid011, validYaml } from "./fixtures";

const orders = {
  name: "orders",
  source: "db.orders",
  description: null,
  primaryKey: [],
  uniqueKeys: [],
  aiContext: null,
  extensions: [],
  fields: [
    {
      name: "amount",
      expressions: [],
      datatype: null,
      description: null,
      aiContext: null,
      extensions: [],
    },
  ],
};

const customers = {
  ...orders,
  name: "customers",
  fields: [{ ...orders.fields[0], name: "customer_id" }],
};

describe("readModel", () => {
  it("reads a 0.2 model and a 0.1.1 model", () => {
    const detail = readModel(parseDocument(detailYaml));
    expect(detail.name).toBe("Shop");
    expect(detail.datasets.map((dataset) => dataset.name)).toEqual(["orders", "customers"]);
    expect(detail.metrics[0]?.references).toEqual([
      { dataset: "orders", field: "amount" },
      { dataset: "customers", field: "customer_id" },
    ]);
    expect(detail.extensions[0]).toEqual({ vendor: "DEMO", kind: "json", value: { warehouse: "ANALYTICS" } });

    const nested = readModel(valid011);
    expect(nested.name).toBe("Demo");
    expect(nested.datasets.map((dataset) => dataset.name)).toEqual(["orders", "customers"]);
    expect(readModel(parseDocument(validYaml)).relationships[0]?.name).toBe("orders_to_customers");
  });

  it("parses extension data that is already an object, and keeps a non-JSON string as text", () => {
    const model = readModel({
      name: "M",
      datasets: [{ name: "orders", source: "s" }],
      custom_extensions: [
        { vendor_name: "OBJECT", data: { ready: true } },
        { vendor_name: "TEXT", data: "not json" },
      ],
    });
    expect(model.extensions).toEqual([
      { vendor: "OBJECT", kind: "json", value: { ready: true } },
      { vendor: "TEXT", kind: "text", text: "not json", note: "This value is not JSON, so it is shown as text." },
    ]);
  });
});

describe("fieldReferences", () => {
  it("lists dataset.field tokens that exist, including a quoted pair, and skips the rest", () => {
    const datasets = [orders, customers];
    expect(
      fieldReferences(
        ["SUM(orders.amount) / COUNT(DISTINCT customers.customer_id)", "SUM(orders.amount)", "'orders.amount'"],
        datasets,
      ),
    ).toEqual([
      { dataset: "orders", field: "amount" },
      { dataset: "customers", field: "customer_id" },
    ]);
    expect(fieldReferences(['SUM("orders"."amount") + orders.missing'], datasets)).toEqual([
      { dataset: "orders", field: "amount" },
    ]);
    expect(fieldReferences(["SUM(sales.orders.amount)"], datasets)).toEqual([
      { dataset: "orders", field: "amount" },
    ]);
  });
});
