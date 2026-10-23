import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App";
import { detailYaml } from "./fixtures";

const namesYaml = `
version: 0.2.0.dev0
name: Names
datasets:
  - name: "sales q1"
    source: db.sales
    fields:
      - name: "net.revenue"
        expression:
          dialects:
            - dialect: ANSI_SQL
              expression: net_revenue
  - name: "q1.sales"
    source: db.q1
    fields:
      - name: amount
        expression:
          dialects:
            - dialect: ANSI_SQL
              expression: amount
metrics:
  - name: "gross margin"
    expression:
      dialects:
        - dialect: ANSI_SQL
          expression: margin
`;

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderFile(hash: string, body: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", text: async () => body })),
  );
  const file = encodeURIComponent("https://example.com/model.yaml");
  window.history.replaceState(null, "", `/?file=${file}${hash}`);
  render(<App />);
}

function markedRow(name: string) {
  return screen.getAllByRole("row").find((row) => row.querySelector("td")?.textContent === name);
}

describe("links", () => {
  it("opens the dataset named by ?file=#dataset/", async () => {
    renderFile("#dataset/orders", detailYaml);
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    expect(screen.getByText("db.orders")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Datasets" })).toBeNull();
  });

  it("opens the field named by ?file=#field/", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderFile("#field/orders.amount", detailYaml);
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    expect(markedRow("amount")?.getAttribute("aria-current")).toBe("true");
    expect(markedRow("order_id")?.getAttribute("aria-current")).toBeNull();
    expect(scroll).toHaveBeenCalled();
  });

  it("opens the metric named by ?file=#metric/", async () => {
    renderFile("#metric/revenue", detailYaml);
    expect(await screen.findByRole("heading", { name: "revenue" })).toBeTruthy();
    expect(screen.getByText("Revenue per customer")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Metrics" })).toBeNull();
  });

  it("round-trips a name with a dot or a space through the hash", async () => {
    renderFile("#field/sales%20q1.net%2Erevenue", namesYaml);
    expect(await screen.findByRole("heading", { name: "sales q1" })).toBeTruthy();
    expect(markedRow("net.revenue")?.getAttribute("aria-current")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(await screen.findByRole("button", { name: "q1.sales" }));
    expect(window.location.hash).toBe("#dataset/q1%2Esales");

    window.location.hash = "#metric/gross%20margin";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(await screen.findByRole("heading", { name: "gross margin" })).toBeTruthy();

    window.location.hash = "#field/sales%20q1.net%2Erevenue";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(await screen.findByRole("heading", { name: "sales q1" })).toBeTruthy();
    expect(markedRow("net.revenue")?.getAttribute("aria-current")).toBe("true");
  });

  it("shows the overview when the hash names an item that is not in the file", async () => {
    renderFile("#dataset/missing", detailYaml);
    expect(await screen.findByText('"missing" is not found in this file.')).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Shop" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Datasets" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Metrics" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("shows the overview when a named field is not in the file", async () => {
    renderFile("#field/orders.missing", detailYaml);
    expect(await screen.findByText('"orders.missing" is not found in this file.')).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Datasets" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Name" })).toBeNull();
  });

  it("treats a malformed hash like an unknown name", async () => {
    renderFile("#field/orders", detailYaml);
    expect(await screen.findByText('"field/orders" is not found in this file.')).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Datasets" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("returns to the previous item when the hash changes", async () => {
    renderFile("#metric/revenue", detailYaml);
    expect(await screen.findByRole("heading", { name: "revenue" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "orders.amount" }));
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    expect(markedRow("amount")?.getAttribute("aria-current")).toBe("true");

    window.location.hash = "#metric/revenue";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(await screen.findByRole("heading", { name: "revenue" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Name" })).toBeNull();
  });

  it("copies the full url when the file was opened by url", async () => {
    let copied = "";
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (text) => {
      copied = String(text);
    });
    renderFile("#metric/revenue", detailYaml);
    expect(await screen.findByRole("heading", { name: "revenue" })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    });
    const url = new URL(copied);
    expect(url.searchParams.get("file")).toBe("https://example.com/model.yaml");
    expect(url.hash).toBe("#metric/revenue");
    expect(screen.queryByText(/cannot reopen a local file/)).toBeNull();
  });

  it("copies only the hash for a file opened from disk and says so", async () => {
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<App />);
    const input = screen.getByLabelText("Open a file");
    const file = new File([detailYaml], "shop.yaml", { type: "application/yaml" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(await screen.findByRole("button", { name: "orders" }));
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith("#dataset/orders");
    expect(await screen.findByText("Copied the hash only. A link cannot reopen a local file.")).toBeTruthy();
  });
});
