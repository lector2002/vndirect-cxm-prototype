import { describe, it, expect } from "vitest";
import { generateCustomers, demoData } from "./demo.ts";
import { dims, seedNav, seedTour, cfgDefault, seed } from "./seed.ts";
import { validateFixture } from "../validate.ts";
import { isSegUnknown, UNKNOWN_YET, MISSING } from "../segment.ts";
import type { Customer, AgeBand, NavBand, TenureBand, AcqChannel } from "../schema/index.ts";

/* Đếm known/chưa-biết/thiếu cho MỘT trục — dùng isSegUnknown/UNKNOWN_YET/MISSING của segment.ts,
   không tự so chuỗi sentinel. */
function counts(values: readonly string[]): { known: number; unknown: number; missing: number } {
  let known = 0, unknown = 0, missing = 0;
  for (const v of values) {
    if (v === UNKNOWN_YET) unknown++;
    else if (v === MISSING) missing++;
    else known++;
  }
  return { known, unknown, missing };
}

describe("demoData — fixture demo 300 khách (Module C, section C4)", () => {
  it("sinh đúng 300 khách, key không trùng, seed thật không bị đụng (vẫn 7 khách)", () => {
    expect(demoData.cust.length).toBe(300);
    const keys = new Set(demoData.cust.map((c) => c.key));
    expect(keys.size).toBe(300);
    expect(seed.cust.length).toBe(7);
  });

  it("sinh TẤT ĐỊNH — gọi generateCustomers(293) hai lần cho kết quả giống hệt nhau", () => {
    // 293 vì demoData = 7 khách thật (seed) + 293 khách sinh = 300 (xem comment tại demoData).
    const a = generateCustomers(293);
    const b = generateCustomers(293);
    expect(a).toEqual(b);
  });

  it("validateFixture(demoData, dims, nav, tour, cfg) trả về RỖNG", () => {
    const errors = validateFixture(demoData, dims, seedNav, seedTour, cfgDefault);
    expect(errors).toEqual([]);
  });

  it("mỗi trục age/nav/tenure/acq: known + chưa-biết + thiếu === 300", () => {
    for (const axis of ["age", "nav", "tenure", "acq"] as const) {
      const values = demoData.cust.map((c) => c[axis] as string);
      const { known, unknown, missing } = counts(values);
      expect(known + unknown + missing).toBe(300);
    }
  });

  it("nav và acq: cả ba nhóm known/chưa-biết/thiếu đều > 0 (có cả hai loại 'không biết')", () => {
    for (const axis of ["nav", "acq"] as const) {
      const values = demoData.cust.map((c) => c[axis] as string);
      const { known, unknown, missing } = counts(values);
      expect(known, `${axis}.known`).toBeGreaterThan(0);
      expect(unknown, `${axis}.unknown`).toBeGreaterThan(0);
      expect(missing, `${axis}.missing`).toBeGreaterThan(0);
    }
  });

  it("age/tenure: không có ổ 'thiếu' cố ý (chỉ known/chưa-biết) — chỉ nav/acq mới có bug thu thập", () => {
    for (const axis of ["age", "tenure"] as const) {
      const values = demoData.cust.map((c) => c[axis] as string);
      const { missing } = counts(values);
      expect(missing, `${axis}.missing`).toBe(0);
    }
  });

  it("mọi AgeBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: AgeBand[] = ["18-24", "25-34", "35-49", "50+"];
    const present = new Set(demoData.cust.map((c) => c.age));
    for (const b of bands) expect(present.has(b), `age band ${b}`).toBe(true);
  });

  it("mọi NavBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: NavBand[] = ["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", ">5tỷ"];
    const present = new Set(demoData.cust.map((c) => c.nav));
    for (const b of bands) expect(present.has(b), `nav band ${b}`).toBe(true);
  });

  it("mọi TenureBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: TenureBand[] = ["<6 tháng", "6-24 tháng", "2-5 năm", ">5 năm"];
    const present = new Set(demoData.cust.map((c) => c.tenure));
    for (const b of bands) expect(present.has(b), `tenure band ${b}`).toBe(true);
  });

  it("mọi AcqChannel khai trong schema đều xuất hiện ít nhất một lần", () => {
    const channels: AcqChannel[] = ["banner", "giới thiệu", "chi nhánh", "tự tìm", "đối tác"];
    const present = new Set(demoData.cust.map((c) => c.acq));
    for (const ch of channels) expect(present.has(ch), `acq channel ${ch}`).toBe(true);
  });

  it("đủ 3 giá trị tier và các seg thật dùng trong seed, đủ pf", () => {
    const tiers = new Set(demoData.cust.map((c) => c.tier));
    expect(tiers.has("new")).toBe(true);
    expect(tiers.has("standard")).toBe(true);
    expect(tiers.has("high-value")).toBe(true);

    const segs = new Set(demoData.cust.map((c) => c.seg));
    expect(segs.has("Mới mở TK")).toBe(true);
    expect(segs.has("Khách chuyển từ CTCK khác")).toBe(true);
    expect(segs.has("Khách 50+")).toBe(true);

    const pfs = new Set(demoData.cust.map((c) => c.pf));
    expect(pfs.has("android")).toBe(true);
    expect(pfs.has("ios")).toBe(true);
  });

  it("bất biến: seg 'Khách 50+' luôn kèm age '50+'", () => {
    for (const c of demoData.cust) {
      if (c.seg === "Khách 50+") expect(c.age).toBe("50+");
    }
  });

  it("bất biến: tier 'high-value' luôn có nav không phải sentinel", () => {
    for (const c of demoData.cust) {
      if (c.tier === "high-value") expect(isSegUnknown(c.nav)).toBe(false);
    }
  });

  it("dùng Customer[] không any — khớp type khi ép vào readonly Customer", () => {
    const sample: Customer = demoData.cust[0];
    expect(typeof sample.key).toBe("string");
  });
});
