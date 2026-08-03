import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_RANGE, useTimeframeStore } from "./timeframe.ts";

// Singleton toàn app — trả về DEFAULT_RANGE sau mỗi test để không rò rỉ sang test khác.
afterEach(() => {
  useTimeframeStore.setState({ range: DEFAULT_RANGE });
});

describe("useTimeframeStore", () => {
  it("mặc định range = DEFAULT_RANGE ('6m')", () => {
    expect(useTimeframeStore.getState().range).toBe("6m");
    expect(DEFAULT_RANGE).toBe("6m");
  });

  it("setRange đổi range, KHÔNG mutate object cũ (reference mới)", () => {
    const before = useTimeframeStore.getState();
    useTimeframeStore.getState().setRange("12m");
    const after = useTimeframeStore.getState();
    expect(after.range).toBe("12m");
    expect(after).not.toBe(before);
  });

  it("KHÔNG dùng localStorage — reload store (giá trị mới) không đọc/ghi window.localStorage", () => {
    const spy = { getItem: 0, setItem: 0 };
    const orig = { getItem: window.localStorage.getItem, setItem: window.localStorage.setItem };
    window.localStorage.getItem = ((...a: Parameters<Storage["getItem"]>) => {
      spy.getItem++;
      return orig.getItem.apply(window.localStorage, a);
    }) as Storage["getItem"];
    window.localStorage.setItem = ((...a: Parameters<Storage["setItem"]>) => {
      spy.setItem++;
      return orig.setItem.apply(window.localStorage, a);
    }) as Storage["setItem"];

    useTimeframeStore.getState().setRange("3m");

    window.localStorage.getItem = orig.getItem;
    window.localStorage.setItem = orig.setItem;
    expect(spy.getItem).toBe(0);
    expect(spy.setItem).toBe(0);
  });
});
