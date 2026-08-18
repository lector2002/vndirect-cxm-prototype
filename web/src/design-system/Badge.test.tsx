import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge.tsx";

describe("Badge", () => {
  it("state=ok: prefix ✓ và nhãn mặc định", () => {
    render(<Badge state="ok" />);
    expect(screen.getByTestId("badge")).toHaveTextContent("✓ OK");
  });

  it("state=good: KHÔNG prefix ✓ (owner 18/08 tối bỏ tick cạnh Live) — nhãn tự phân biệt", () => {
    render(<Badge state="good" text="Live" />);
    expect(screen.getByTestId("badge").textContent).toBe("Live");
  });

  it("good dùng token màu good (bg/border/text) — khác ok vốn không màu", () => {
    render(<Badge state="good" />);
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("bg-good-bg");
    expect(el.className).toContain("text-good");
  });

  it("state=unknown: prefix — và nhãn mặc định", () => {
    render(<Badge state="unknown" />);
    expect(screen.getByTestId("badge")).toHaveTextContent("— No data");
  });

  it("state=watch/crit: không prefix, nhãn mặc định", () => {
    render(<Badge state="watch" />);
    expect(screen.getByTestId("badge")).toHaveTextContent("Warning");
    expect(screen.getByTestId("badge").textContent).not.toMatch(/^[✓—]/);
  });

  it("text tùy chỉnh ghi đè nhãn mặc định nhưng vẫn giữ prefix", () => {
    render(<Badge state="ok" text="Không theo dõi" />);
    expect(screen.getByTestId("badge")).toHaveTextContent("✓ Không theo dõi");
  });

  it("watch dùng token màu watch (bg/border/text)", () => {
    render(<Badge state="watch" />);
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("bg-watch-bg");
    expect(el.className).toContain("text-watch");
  });

  it("crit dùng token màu crit (bg/border/text)", () => {
    render(<Badge state="crit" />);
    const el = screen.getByTestId("badge");
    expect(el.className).toContain("bg-crit-bg");
    expect(el.className).toContain("text-crit");
  });
});
