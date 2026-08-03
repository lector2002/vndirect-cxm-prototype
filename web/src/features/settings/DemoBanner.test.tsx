import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoBanner } from "./DemoBanner.tsx";

describe("DemoBanner", () => {
  it("demoMode=true → render null (không có banner)", () => {
    const { container } = render(<DemoBanner demoMode={true} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("demoMode=false → hiện banner với nội dung cảnh báo", () => {
    render(<DemoBanner demoMode={false} />);
    expect(screen.getByTestId("demo-banner")).toBeInTheDocument();
    expect(screen.getByText(/Demo Mode đang TẮT/)).toBeInTheDocument();
  });
});
