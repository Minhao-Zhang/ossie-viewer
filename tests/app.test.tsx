import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App";
import { invalidYaml, validYaml } from "./fixtures";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function upload(contents: string, name: string) {
  const input = screen.getByLabelText("Open a file");
  const file = new File([contents], name, { type: "application/yaml" });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("App", () => {
  it("shows the version of a valid file and no errors", async () => {
    render(<App />);
    upload(validYaml, "model.yaml");
    expect(await screen.findByText("Version 0.2.0.dev0")).toBeTruthy();
    expect(screen.getByText("No validation errors.")).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Validation errors" })).toBeNull();
    expect(screen.getByText("model.yaml")).toBeTruthy();
    const orders = [...document.querySelectorAll(".react-flow__node")].find((node) =>
      node.textContent?.includes("orders"),
    );
    expect(orders?.getAttribute("style")).toContain("visible");
    expect(document.querySelectorAll(".react-flow__edge").length).toBe(1);
    fireEvent.click(orders!);
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    expect(screen.getByText("db.orders")).toBeTruthy();
  });

  it("names the failing path for an invalid file", async () => {
    render(<App />);
    upload(invalidYaml, "broken.yaml");
    const list = await screen.findByRole("list", { name: "Validation errors" });
    expect(list.textContent).toContain("/datasets/2/fields/0/name");
    expect(screen.getByText("Version 0.2.0.dev0")).toBeTruthy();
  });

  it("opens a file dropped on the page", async () => {
    render(<App />);
    const file = new File([validYaml], "dropped.yaml", { type: "application/yaml" });
    fireEvent.drop(window, { dataTransfer: { files: [file], types: ["Files"] } });
    expect(await screen.findByText("dropped.yaml")).toBeTruthy();
    expect(screen.getByText("Version 0.2.0.dev0")).toBeTruthy();
  });

  it("loads ?file= and says when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    window.history.replaceState(null, "", "/?file=https://example.com/model.yaml");
    render(<App />);
    const failure = await screen.findByText(/Could not fetch https:\/\/example.com\/model.yaml/);
    expect(failure.textContent).toContain("CORS");
  });

  it("opens a URL typed into the field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", text: async () => validYaml })),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "https://example.com/model.yaml" } });
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Version 0.2.0.dev0")).toBeTruthy();
    expect(screen.getByText("No validation errors.")).toBeTruthy();
  });
});
