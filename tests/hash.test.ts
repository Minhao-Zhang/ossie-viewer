import { describe, expect, it } from "vitest";

import { linkToCopy, parseHash, selectionHash } from "../src/hash";
import type { Selection } from "../src/selection";

describe("hash", () => {
  it("encodes a dot and a space so a field link splits on one raw dot", () => {
    const selection: Selection = { kind: "field", dataset: "sales q1", name: "net.revenue" };
    const hash = selectionHash(selection);
    expect(hash).toBe("#field/sales%20q1.net%2Erevenue");
    expect(parseHash(hash)).toEqual({ kind: "item", selection, label: "sales q1.net.revenue" });
  });

  it("encodes a dot in a dataset name", () => {
    const selection: Selection = { kind: "dataset", name: "q1.sales" };
    expect(selectionHash(selection)).toBe("#dataset/q1%2Esales");
    expect(parseHash("#dataset/q1%2Esales")).toEqual({ kind: "item", selection, label: "q1.sales" });
  });

  it("treats an empty hash as the overview and a broken hash as unusable", () => {
    expect(parseHash("")).toEqual({ kind: "overview" });
    expect(parseHash("#")).toEqual({ kind: "overview" });
    expect(parseHash("#field/orders")).toEqual({ kind: "bad", label: "field/orders" });
    expect(parseHash("#dataset/")).toEqual({ kind: "bad", label: "dataset/" });
  });

  it("builds a full url for a file opened by url, and only the hash for a local file", () => {
    window.history.replaceState(null, "", "/");
    const metric: Selection = { kind: "metric", name: "gross margin" };
    expect(linkToCopy(metric, null)).toEqual({ text: "#metric/gross%20margin", local: true });
    const linked = linkToCopy(metric, "https://example.com/model.yaml");
    expect(linked.local).toBe(false);
    const url = new URL(linked.text);
    expect(url.searchParams.get("file")).toBe("https://example.com/model.yaml");
    expect(url.hash).toBe("#metric/gross%20margin");
  });
});
