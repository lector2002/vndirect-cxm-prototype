import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValidateBanner } from "./ValidateBanner.tsx";

describe("ValidateBanner", () => {
  it("errors rỗng → không render gì", () => {
    render(<ValidateBanner errors={[]} />);
    expect(screen.queryByTestId("validate-banner")).not.toBeInTheDocument();
  });

  it("có lỗi → hiện banner với mọi lỗi", () => {
    render(<ValidateBanner errors={["x", "y"]} />);
    const banner = screen.getByTestId("validate-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent("x");
    expect(banner).toHaveTextContent("y");
  });
});
