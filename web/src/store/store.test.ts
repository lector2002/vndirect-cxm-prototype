import { describe, it, expect, beforeEach } from "vitest";
import { createCxmStore } from "./store.ts";
import type { CxmStore } from "./store.ts";
import { MockRepository } from "../data/mock-repository.ts";

describe("CxmStore", () => {
  let store: ReturnType<typeof createCxmStore>;

  beforeEach(() => {
    // Mỗi test 1 store + 1 MockRepository riêng — tránh state rò rỉ giữa test.
    store = createCxmStore(new MockRepository());
  });

  function state(): CxmStore {
    return store.getState();
  }

  describe("Khởi tạo snapshot", () => {
    it("data/cfg/dims khớp seed (không rỗng)", () => {
      const s = state();
      const fresh = new MockRepository();
      expect(s.data.qt.length).toBeGreaterThan(0);
      expect(s.data.qt.length).toBe(fresh.getSnapshot().qt.length);
      expect(s.data.dash.length).toBe(fresh.getSnapshot().dash.length);
      expect(Object.keys(s.cfg).length).toBeGreaterThan(0);
      expect(Object.keys(s.dims).length).toBeGreaterThan(0);
    });

    it("boards là object rỗng lúc khởi tạo (chưa set nào bị tùy chỉnh)", () => {
      // Đúng hành vi MockRepository: overlay boards chỉ có mặt sau khi setBoardBlocks.
      expect(state().boards).toEqual({});
    });

    it("validate() trên state gốc trả rỗng", () => {
      expect(state().validate()).toEqual([]);
    });
  });

  describe("Reference ổn định (không mutation)", () => {
    it("2 lần đọc data liên tiếp cùng reference", () => {
      const a = state().data;
      const b = state().data;
      expect(a).toBe(b);
    });

    it("cfg/dims/boards cũng giữ reference qua các lần đọc", () => {
      const s1 = state();
      const s2 = state();
      expect(s1.cfg).toBe(s2.cfg);
      expect(s1.dims).toBe(s2.dims);
      expect(s1.boards).toBe(s2.boards);
    });
  });

  describe("Quantify", () => {
    it("saveQuantify (thêm mới) → data.qt tăng, reference data đổi", () => {
      const before = state().data;
      const beforeLen = before.qt.length;
      state().saveQuantify({ id: "qu-store-new", kind: "show", show: "pf", metric: "count", chart: "rank", name: "Store test" });
      const after = state().data;
      expect(after.qt.length).toBe(beforeLen + 1);
      expect(after).not.toBe(before);
      expect(state().validate()).toEqual([]);
    });

    it("duplicateQuantify → data.qt tăng 1, trả về item mới", () => {
      const src = state().data.qt[0];
      const beforeLen = state().data.qt.length;
      const copy = state().duplicateQuantify(src.id);
      expect(state().data.qt.length).toBe(beforeLen + 1);
      expect(copy.id).not.toBe(src.id);
      expect(state().validate()).toEqual([]);
    });

    it("deleteQuantify item KHÔNG dùng → data.qt giảm 1", () => {
      const free = state().data.qt.find((q) => state().quantifyUsedBy(q.id).length === 0);
      expect(free).toBeDefined();
      const beforeLen = state().data.qt.length;
      state().deleteQuantify(free!.id);
      expect(state().data.qt.length).toBe(beforeLen - 1);
      expect(state().validate()).toEqual([]);
    });

    it("deleteQuantify item ĐANG DÙNG → bị chặn, data.qt KHÔNG giảm, không crash store", () => {
      const voc = state().data.dash.find((d) => d.id === "b-voc-all")!;
      const usedId = voc.qs.flatMap((q) => q.b).find((b) => !b.startsWith("@"))!;
      expect(usedId).toBeDefined();
      const beforeLen = state().data.qt.length;

      expect(() => state().deleteQuantify(usedId)).toThrow();

      // Store vẫn dùng được bình thường sau lỗi (không crash), state không đổi.
      expect(state().data.qt.length).toBe(beforeLen);
      expect(state().data.qt.some((q) => q.id === usedId)).toBe(true);
      expect(state().validate()).toEqual([]);
    });

    it("quantifyUsedBy đọc được qua store (không mutate)", () => {
      const voc = state().data.dash.find((d) => d.id === "b-voc-all")!;
      const usedId = voc.qs.flatMap((q) => q.b).find((b) => !b.startsWith("@"))!;
      expect(state().quantifyUsedBy(usedId)).toContain("b-voc-all");
    });
  });

  describe("Set / dashboard", () => {
    it("createSet → data.dash tăng 1", () => {
      const beforeLen = state().data.dash.length;
      const created = state().createSet("voc");
      expect(state().data.dash.length).toBe(beforeLen + 1);
      expect(created.sec).toBe("voc");
      expect(state().validate()).toEqual([]);
    });

    it("deleteSet → data.dash giảm 1", () => {
      const created = state().createSet("cxm");
      const beforeLen = state().data.dash.length;
      state().deleteSet(created.id);
      expect(state().data.dash.length).toBe(beforeLen - 1);
      expect(state().validate()).toEqual([]);
    });

    it("deleteSet set khóa → bị chặn, không crash store", () => {
      const beforeLen = state().data.dash.length;
      expect(() => state().deleteSet("b-cxm-exec")).toThrow();
      expect(state().data.dash.length).toBe(beforeLen);
      expect(state().validate()).toEqual([]);
    });

    it("renameSet → data.dash cập nhật tên", () => {
      const target = state().data.dash[0];
      state().renameSet(target.id, "Tên mới qua store");
      expect(state().data.dash.find((d) => d.id === target.id)?.name).toBe("Tên mới qua store");
      expect(state().validate()).toEqual([]);
    });

    it("setBoardBlocks → boards cập nhật; resetBoard → boards về rỗng lại", () => {
      const setId = "b-voc-all";
      const original = state().data.dash.find((d) => d.id === setId)!.qs[0].b;

      state().setBoardBlocks(setId, 0, [...original, "q13"]);
      expect(state().boards[setId]?.[0]).toContain("q13");
      expect(state().validate()).toEqual([]);

      state().resetBoard(setId);
      expect(state().boards[setId]).toBeUndefined();
      expect(state().validate()).toEqual([]);
    });
  });

  describe("Work (điểm gãy & xử lý)", () => {
    it("confirmIssue qua store → cf='confirmed', reference data đổi, validate() rỗng", () => {
      const before = state().data;
      expect(before.act.find((a) => a.id === "CXA-024")?.cf).toBe("pending");

      const result = state().confirmIssue("CXA-024", { owner: "Minh Quân" });
      expect(result.cf).toBe("confirmed");

      const after = state().data;
      expect(after).not.toBe(before);
      expect(after.act.find((a) => a.id === "CXA-024")?.cf).toBe("confirmed");
      expect(after.snap.find((s) => s.iss === "CXI-024")).toBeDefined();
      expect(state().validate()).toEqual([]);
    });

    it("confirmIssue owner rỗng qua store → bị chặn, không crash store, data KHÔNG đổi", () => {
      const before = state().data;
      expect(() => state().confirmIssue("CXA-024", { owner: "" })).toThrow();
      expect(state().data).toBe(before);
      expect(state().validate()).toEqual([]);
    });
  });

  describe("Cấu hình (setCfg)", () => {
    /** Cut sát 0 cho nav — thêm cut 1 vào đầu ⇒ dải đầu thành "0đ" (xem data/projectBands.test.ts). */
    function zeroAssetSegment() {
      const cfg = state().cfg;
      return { ...cfg.segment, band: { ...cfg.segment.band, nav: { min: null, cuts: [1, 50e6, 200e6, 1e9, 5e9], unit: "đ" as const } } };
    }

    it("setCfg đổi cut ⇒ refresh() nạp lại CẢ data, không chỉ cfg", () => {
      /* Mắt nối quyết định việc màn #/rules có vẽ lại được hay không: nhãn dải của khách nằm trong
         `data` (getSnapshot chiếu theo cfg), nên nếu setCfg chỉ set lại `cfg` mà không refresh `data`
         thì chart vẫn hiện nhãn theo cut cũ dù cfg đã đổi. */
      const navBefore = state().data.cust.find((c) => c.navVnd === 0)!.bands.nav;
      expect(navBefore).toBe("<50tr");

      state().setCfg({ segment: zeroAssetSegment() });

      expect(state().cfg.segment.band.nav.cuts).toEqual([1, 50e6, 200e6, 1e9, 5e9]);
      expect(state().data.cust.find((c) => c.navVnd === 0)!.bands.nav).toBe("0đ");
      expect(state().validate()).toEqual([]);
    });

    it("setCfg với cut sai → bị chặn, cfg và data KHÔNG đổi (như deleteQuantify)", () => {
      const cfgBefore = state().cfg;
      const dataBefore = state().data;
      const bad = { ...cfgBefore.segment, band: { ...cfgBefore.segment.band, nav: { min: null, cuts: [200e6, 50e6], unit: "đ" as const } } };

      expect(() => state().setCfg({ segment: bad })).toThrow();
      expect(state().cfg).toBe(cfgBefore);
      expect(state().data).toBe(dataBefore);
      expect(state().validate()).toEqual([]);
    });
  });
});
