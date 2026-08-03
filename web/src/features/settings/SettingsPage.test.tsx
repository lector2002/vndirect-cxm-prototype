import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createCxmStore } from "../../store/store.ts";
import { MockRepository } from "../../data/mock-repository.ts";
import { SettingsPage } from "./SettingsPage.tsx";

describe("SettingsPage", () => {
  let store: ReturnType<typeof createCxmStore>;

  beforeEach(() => {
    store = createCxmStore(new MockRepository());
  });

  it("mặc định hiện switch ở trạng thái BẬT (aria-checked=true)", () => {
    render(<SettingsPage useStore={store} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Đang BẬT")).toBeInTheDocument();
  });

  it("click switch → tắt Demo Mode, aria-checked=false và store.demoMode=false", () => {
    render(<SettingsPage useStore={store} />);
    const sw = screen.getByRole("switch");

    fireEvent.click(sw);

    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Đang TẮT")).toBeInTheDocument();
    expect(store.getState().demoMode).toBe(false);
    expect(store.getState().data.tax.length).toBe(0);
  });
});
