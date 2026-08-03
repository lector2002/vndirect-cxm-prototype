import { describe, it, expect, beforeEach } from "vitest";
import { createCxmStore, useCxmStore } from "./store.ts";
import type { CxmStore } from "./store.ts";
import { MockRepository } from "../data/mock-repository.ts";

describe("CxmStore — Demo Mode", () => {
  let store: ReturnType<typeof createCxmStore>;

  beforeEach(() => {
    store = createCxmStore(new MockRepository());
  });

  function state(): CxmStore {
    return store.getState();
  }

  it("mặc định demoMode=true và data khớp seed (không rỗng)", () => {
    expect(state().demoMode).toBe(true);
    expect(state().data.tax.length).toBeGreaterThan(0);
    expect(state().data.iss.length).toBeGreaterThan(0);
  });

  /* Owner chốt 03/08: app thật chạy trên `demoData` (300 khách), KHÔNG phải `seed` (7). Test này
     là thứ duy nhất chặn `demoData` rơi lại thành dead code — nếu ai đó đổi singleton về mặc định
     thì mọi test khác vẫn xanh (chúng đều tiêm repo riêng), chỉ test này đỏ. */
  it("SINGLETON của app chạy demoData (300 khách), còn createCxmStore mặc định vẫn là seed (7)", () => {
    expect(useCxmStore.getState().data.cust).toHaveLength(300);
    expect(createCxmStore(new MockRepository()).getState().data.cust).toHaveLength(7);
  });

  it("setDemoMode(false) → demoMode=false, data rỗng toàn bộ", () => {
    state().setDemoMode(false);
    expect(state().demoMode).toBe(false);
    expect(state().data.tax.length).toBe(0);
    expect(state().data.iss.length).toBe(0);
    expect(state().data.qt.length).toBe(0);
    expect(state().data.dash.length).toBe(0);
    expect(state().data.cats).toEqual({});
  });

  it("setDemoMode(true) sau khi tắt → khôi phục data demo (không rỗng)", () => {
    state().setDemoMode(false);
    state().setDemoMode(true);
    expect(state().demoMode).toBe(true);
    expect(state().data.tax.length).toBeGreaterThan(0);
  });

  it("mutation khi demoMode=false → refresh() KHÔNG nạp lại data thật (vẫn rỗng)", () => {
    state().setDemoMode(false);
    state().createSet("voc");
    expect(state().demoMode).toBe(false);
    expect(state().data.dash.length).toBe(0);
  });
});
