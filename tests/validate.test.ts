import { describe, expect, it } from "vitest";

import { openText } from "../src/document";
import { inspect } from "../src/validate";
import { invalidYaml, valid011, validYaml } from "./fixtures";

const valid020 = {
  version: "0.2.0.dev0",
  name: "Demo",
  datasets: [{ name: "orders", source: "db.orders" }],
};

describe("inspect", () => {
  it("uses the 0.2.0.dev0 schema for that version", () => {
    const opened = inspect(valid020);
    expect(opened.schema).toBe("0.2.0.dev0");
    expect(opened.issues).toEqual([]);
    expect(inspect({ ...valid020, version: "0.1.1" }).issues.length).toBeGreaterThan(0);
  });

  it("uses the 0.1.1 schema for that version", () => {
    const opened = inspect(valid011);
    expect(opened.schema).toBe("0.1.1");
    expect(opened.issues).toEqual([]);
    expect(inspect({ ...valid011, version: "0.2.0.dev0" }).issues.length).toBeGreaterThan(0);
  });

  it("reports an unknown version and the versions it knows", () => {
    const opened = inspect({ version: "9.9.9", name: "Demo", datasets: [] });
    expect(opened.version).toBe("9.9.9");
    expect(opened.schema).toBeNull();
    expect(opened.issues).toEqual([
      {
        path: "/version",
        message: 'Unknown version "9.9.9". This viewer knows 0.2.0.dev0 and 0.1.1.',
      },
    ]);
  });

  it("names the failing path on an invalid document", () => {
    const opened = openText(invalidYaml);
    expect(opened.version).toBe("0.2.0.dev0");
    expect(opened.issues.some((issue) => issue.path === "/datasets/2/fields/0/name")).toBe(true);
    expect(opened.graph.nodes).toHaveLength(3);
  });

  it("reads JSON as well as YAML", () => {
    const opened = openText(JSON.stringify(valid020));
    expect(opened.parseError).toBeNull();
    expect(opened.version).toBe("0.2.0.dev0");
    expect(opened.issues).toEqual([]);
  });

  it("reads a valid document with its version and no errors", () => {
    const opened = openText(validYaml);
    expect(opened.parseError).toBeNull();
    expect(opened.version).toBe("0.2.0.dev0");
    expect(opened.issues).toEqual([]);
  });
});
