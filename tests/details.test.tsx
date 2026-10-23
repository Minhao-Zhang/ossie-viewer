import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { App } from "../src/App";
import { ExtensionsView } from "../src/ExtensionsView";
import { readModel } from "../src/model";
import { detailYaml } from "./fixtures";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(cleanup);

function upload(contents: string, name: string) {
  const input = screen.getByLabelText("Open a file");
  const file = new File([contents], name, { type: "application/yaml" });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("dataset and metric views", () => {
  it("renders the fixture and follows a metric's field links", async () => {
    render(<App />);
    upload(detailYaml, "shop.yaml");

    expect(await screen.findByRole("heading", { name: "Shop" })).toBeTruthy();
    expect(screen.getByText("No validation errors.")).toBeTruthy();
    expect(screen.getByText("A small shop")).toBeTruthy();
    expect(screen.getByText("Prefer recent orders.")).toBeTruthy();
    expect(screen.getByText("DEMO")).toBeTruthy();
    expect(screen.getByText(/ANALYTICS/)).toBeTruthy();
    expect(screen.getByText("2 datasets, 1 relationship, 1 metric.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "orders" }));
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    expect(screen.getByText("Customer orders")).toBeTruthy();
    expect(screen.getByText("db.orders")).toBeTruthy();
    expect(screen.getByText("order_number")).toBeTruthy();
    expect(screen.getByText("Use for sales.")).toBeTruthy();
    expect(screen.getByText("purchases, tickets")).toBeTruthy();
    expect(screen.getByText("SNOWFLAKE")).toBeTruthy();
    expect(screen.getByText(/PUBLIC/)).toBeTruthy();
    const orderId = screen.getAllByRole("row").find((row) => row.querySelector("td")?.textContent === "order_id");
    expect(orderId?.textContent).toContain("Integer");
    expect(orderId?.textContent).toContain("order_id");
    expect(orderId?.textContent).toContain("Order identifier");
    expect(orderId?.textContent).toContain("The primary key.");
    expect(screen.getByText("buyer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "customers" }));
    expect(await screen.findByRole("heading", { name: "customers" })).toBeTruthy();
    expect(screen.getByText("db.customers")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "revenue" }));
    expect(await screen.findByRole("heading", { name: "revenue" })).toBeTruthy();
    expect(screen.getByText("Revenue per customer")).toBeTruthy();
    expect(screen.getByText("ANSI_SQL")).toBeTruthy();
    expect(screen.getByText("SUM(orders.amount) / COUNT(DISTINCT customers.customer_id)")).toBeTruthy();
    expect(screen.getByText("SNOWFLAKE")).toBeTruthy();
    expect(screen.getByText("SUM(orders.amount)")).toBeTruthy();
    expect(screen.getByText("sales")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "orders.amount" }));
    expect(await screen.findByRole("heading", { name: "orders" })).toBeTruthy();
    const amount = screen.getAllByRole("row").find((row) => row.querySelector("td")?.textContent === "amount");
    expect(amount?.getAttribute("aria-current")).toBe("true");
    expect(screen.getAllByRole("row").find((row) => row.querySelector("td")?.textContent === "order_id")?.getAttribute("aria-current")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "revenue" }));
    fireEvent.click(screen.getByRole("button", { name: "customers.customer_id" }));
    expect(await screen.findByRole("heading", { name: "customers" })).toBeTruthy();
    expect(screen.getAllByRole("row").find((row) => row.querySelector("td")?.textContent === "customer_id")?.getAttribute("aria-current")).toBe("true");
  });

  it("shows a non-JSON extension as text", () => {
    const model = readModel({
      name: "M",
      datasets: [],
      custom_extensions: [{ vendor_name: "TEXT", data: "not json" }],
    });
    render(<ExtensionsView extensions={model.extensions} />);
    expect(screen.getByText("TEXT")).toBeTruthy();
    expect(screen.getByText("not json")).toBeTruthy();
    expect(screen.getByText("This value is not JSON, so it is shown as text.")).toBeTruthy();
  });
});
