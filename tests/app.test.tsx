import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../src/App";

describe("App", () => {
  it("renders the empty page", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Ossie viewer" })).toBeTruthy();
  });
});
