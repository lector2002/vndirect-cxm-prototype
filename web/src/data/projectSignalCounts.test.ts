import { describe, it, expect } from "vitest";
import { NOT_IDENTIFIED, SIG_CUST_DIMS, SIG_FIRE_DIM, projectSignalCounts } from "./projectSignalCounts.ts";
import { cfgDefault, dims, seed } from "./fixtures/seed.ts";
import { demoData } from "./fixtures/demo.ts";
import { projectCustomerBands } from "./projectBands.ts";
import type { Cfg, Customer } from "./schema/index.ts";

/* Ba khách tối giản, đủ để so tay bằng con mắt: một khách "thấy được" (nav/age/tier/acq đều biết),
   một khách khác nav để tách thành hai dải sau khi đổi cfg, và không khách nào cần seg/tenure (hai
   chiều đã rút khỏi danh sách 5 chiều của chart điểm đo — thiết kế §4). */
function miniCust(): Customer[] {
  return [
    {
      key: "KH•••AAA", seg: "Mới mở TK", tier: "standard", pf: "android", st: "test",
      ageYears: 30, navVnd: 60e6, tenureMonths: 10,
      bands: {}, acq: "banner",
    },
    {
      key: "KH•••BBB", seg: "Mới mở TK", tier: "high-value", pf: "ios", st: "test",
      ageYears: 40, navVnd: 6e9, tenureMonths: 40,
      bands: {}, acq: "tự tìm",
    },
  ];
}

function projectedMiniCust(cfg: Cfg = cfgDefault): Customer[] {
  return projectCustomerBands({ ...seed, cust: miniCust() }, cfg, dims).cust;
}

describe("projectSignalCounts — phép cộng ra năm bảng đếm", () => {
  it("tổng n của MỘT chiều bất kỳ bằng đúng số lần bắn đã cho vào (ràng buộc 1)", () => {
    const cust = projectedMiniCust();
    const fires = [
      { sigId: "sg-t", val: "a", custKey: "KH•••AAA", pf: "android", at: "2026-05-01" },
      { sigId: "sg-t", val: "a", custKey: "KH•••BBB", pf: "ios", at: "2026-05-01" },
      { sigId: "sg-t", val: "b", custKey: null, pf: "web", at: "2026-05-01" },
    ];
    const rows = projectSignalCounts(fires, cust, dims);
    for (const dim of [...SIG_CUST_DIMS, SIG_FIRE_DIM]) {
      const total = rows.filter((r) => r.dim === dim).reduce((a, r) => a + r.n, 0);
      expect(total).toBe(fires.length);
    }
  });

  it("năm bảng đếm khớp nhau CHO TỪNG GIÁ TRỊ, không chỉ khớp tổng (ràng buộc 2)", () => {
    const cust = projectedMiniCust();
    const fires = [
      { sigId: "sg-t", val: "a", custKey: "KH•••AAA", pf: "android", at: "2026-05-01" },
      { sigId: "sg-t", val: "a", custKey: "KH•••BBB", pf: "ios", at: "2026-05-01" },
      { sigId: "sg-t", val: "b", custKey: null, pf: "web", at: "2026-05-01" },
    ];
    const rows = projectSignalCounts(fires, cust, dims);
    for (const val of ["a", "b"]) {
      const totals = [...SIG_CUST_DIMS, SIG_FIRE_DIM].map((dim) =>
        rows.filter((r) => r.dim === dim && r.val === val).reduce((a, r) => a + r.n, 0),
      );
      expect(new Set(totals).size).toBe(1);
    }
  });

  it("custKey null ⇒ bốn chiều khách nhận band NOT_IDENTIFIED, chiều sigpf vẫn có nền tảng thật", () => {
    const cust = projectedMiniCust();
    const fires = [{ sigId: "sg-t", val: "a", custKey: null, pf: "web", at: "2026-05-01" }];
    const rows = projectSignalCounts(fires, cust, dims);
    for (const dim of SIG_CUST_DIMS) {
      expect(rows.find((r) => r.dim === dim)).toMatchObject({ band: NOT_IDENTIFIED, n: 1 });
    }
    const sigpfRow = rows.find((r) => r.dim === SIG_FIRE_DIM)!;
    expect(sigpfRow.band).toBe("web");
    expect(sigpfRow.band).not.toBe(NOT_IDENTIFIED);
  });

  it("custKey có thật ⇒ band bốn chiều khách đọc đúng nhãn/giá trị của khách đó", () => {
    const cust = projectedMiniCust();
    const fires = [{ sigId: "sg-t", val: "a", custKey: "KH•••BBB", pf: "ios", at: "2026-05-01" }];
    const rows = projectSignalCounts(fires, cust, dims);
    const bandOf = (dim: string) => rows.find((r) => r.dim === dim)?.band;
    expect(bandOf("acq")).toBe("tự tìm"); // values-cut, đọc thẳng field
    expect(bandOf("tier")).toBe("high-value"); // values-cut
    expect(bandOf("age")).toBe(cust.find((c) => c.key === "KH•••BBB")!.bands.age); // band-cut
    expect(bandOf("nav")).toBe(cust.find((c) => c.key === "KH•••BBB")!.bands.nav); // band-cut
  });

  it("custKey không khớp khách nào trong danh sách truyền vào ⇒ ném lỗi rõ ràng, không âm thầm bỏ qua", () => {
    const cust = projectedMiniCust();
    const fires = [{ sigId: "sg-t", val: "a", custKey: "KH•••KHONGTON", pf: "ios", at: "2026-05-01" }];
    expect(() => projectSignalCounts(fires, cust, dims)).toThrow(/không khớp khách nào/);
  });

  it("dims khai sai (chiều không phải base:'cust' hợp lệ) ⇒ ném ngay, không đợi tới lần bắn nào", () => {
    const cust = projectedMiniCust();
    const badDims = { ...dims, acq: { ...dims.acq, cut: undefined } };
    expect(() => projectSignalCounts([], cust, badDims)).toThrow(/không phải chiều khách hợp lệ/);
  });

  it("mảng fires rỗng ⇒ mảng SigCount rỗng, không throw", () => {
    expect(projectSignalCounts([], projectedMiniCust(), dims)).toEqual([]);
  });

  /* Nghiệm thu quan trọng nhất của section (contract): đổi ranh giới NAV trong cfg rồi chiếu lại →
     band của chiều nav trong sigCounts phải chia lại theo ranh giới mới, KHÔNG sửa dòng code nào. */
  it("đổi ranh giới NAV trong cfg ⇒ band của chiều 'nav' trong sigCounts chia lại theo ranh giới mới", () => {
    const fires = [{ sigId: "sg-t", val: "a", custKey: "KH•••BBB", pf: "ios", at: "2026-05-01" }];

    const before = projectSignalCounts(fires, projectedMiniCust(cfgDefault), dims);
    const navBefore = before.find((r) => r.dim === "nav")!.band;
    expect(navBefore).toBe("5tỷ+"); // navVnd = 6e9 dưới cfgDefault (cuts 50e6/200e6/1e9/5e9)

    const cfgNarrow: Cfg = structuredClone(cfgDefault);
    cfgNarrow.segment.band.nav = { min: null, cuts: [50e6, 200e6, 1e9, 5e9, 8e9], unit: "đ" };
    const after = projectSignalCounts(fires, projectedMiniCust(cfgNarrow), dims);
    const navAfter = after.find((r) => r.dim === "nav")!.band;

    expect(navAfter).not.toBe(navBefore);
    expect(navAfter).toBe("5-8tỷ");
  });

  /* Bản mạnh hơn của test trên: hai khách "KH•••BBB" (nav=6e9) và "KH•••CCC" (nav=9e9) đều rơi vào
     CÙNG MỘT dải "5tỷ+" dưới cfgDefault (chỉ 1 dải cho mọi thứ trên 5 tỷ) — đây là chỗ chart điểm đo
     sẽ gộp hai khách khác hẳn nhau vào một cột. Thêm ranh giới 8e9 phải TÁCH cột đó thành hai, không
     chỉ đổi TÊN của một cột như test ở trên. */
  it("thêm ranh giới NAV mới ⇒ MỘT dải gộp trước đó TÁCH THẬT thành hai dải, không chỉ đổi tên", () => {
    const custWithThird: Customer[] = [
      ...miniCust(),
      { key: "KH•••CCC", seg: "Mới mở TK", tier: "high-value", pf: "web", st: "test",
        ageYears: 45, navVnd: 9e9, tenureMonths: 50, bands: {}, acq: "tự tìm" },
    ];
    const fires = [
      { sigId: "sg-t", val: "a", custKey: "KH•••BBB", pf: "ios", at: "2026-05-01" },
      { sigId: "sg-t", val: "a", custKey: "KH•••CCC", pf: "web", at: "2026-05-01" },
    ];

    const projectedBefore = projectCustomerBands({ ...seed, cust: custWithThird }, cfgDefault, dims).cust;
    const before = projectSignalCounts(fires, projectedBefore, dims);
    const navBandsBefore = new Set(before.filter((r) => r.dim === "nav").map((r) => r.band));
    expect(navBandsBefore.size).toBe(1); // 6e9 và 9e9 CHƯA tách — cùng rơi vào "5tỷ+"

    const cfgNarrow: Cfg = structuredClone(cfgDefault);
    cfgNarrow.segment.band.nav = { min: null, cuts: [50e6, 200e6, 1e9, 5e9, 8e9], unit: "đ" };
    const projectedAfter = projectCustomerBands({ ...seed, cust: custWithThird }, cfgNarrow, dims).cust;
    const after = projectSignalCounts(fires, projectedAfter, dims);
    const navBandsAfter = new Set(after.filter((r) => r.dim === "nav").map((r) => r.band));
    expect(navBandsAfter.size).toBe(2); // 6e9 → "5-8tỷ", 9e9 → "8tỷ+" — dải cũ đã CHIA THẬT làm hai
  });
});

describe("projectSignalCounts trên demoData — kiểm trên dữ liệu sinh thật (300 khách)", () => {
  it("mọi signal có vol > 0 và values khai báo đều để lại dấu vết trong demoData.sigCounts", () => {
    for (const sig of seed.signals) {
      if (sig.vol === 0 || sig.values.length === 0) continue;
      const rows = demoData.sigCounts.filter((r) => r.sig === sig.id);
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it("signal gap/designed (vol=0) không sinh dòng nào trong sigCounts", () => {
    for (const sig of seed.signals) {
      if (sig.vol !== 0) continue;
      expect(demoData.sigCounts.filter((r) => r.sig === sig.id)).toEqual([]);
    }
  });

  it("chiều sigpf KHÔNG BAO GIỜ mang band NOT_IDENTIFIED — lần bắn luôn biết nền tảng của chính nó", () => {
    const sigpfRows = demoData.sigCounts.filter((r) => r.dim === SIG_FIRE_DIM);
    expect(sigpfRows.length).toBeGreaterThan(0);
    expect(sigpfRows.some((r) => r.band === NOT_IDENTIFIED)).toBe(false);
  });

  it("sg4 (ekyc_document_fail_reason) — tổng mỗi chiều bằng đúng vol, và giá trị đếm được PHỦ bản khai", () => {
    const sig = seed.signals.find((s) => s.id === "sg4")!;
    const rows = demoData.sigCounts.filter((r) => r.sig === "sg4");
    for (const dim of [...SIG_CUST_DIMS, SIG_FIRE_DIM]) {
      const total = rows.filter((r) => r.dim === dim).reduce((a, r) => a + r.n, 0);
      expect(total).toBe(sig.vol);
    }
    /* Trước 14/08 ca này khẳng định tập giá trị đếm được BẰNG ĐÚNG bản khai. Bất biến đó chết cùng
       luật validate vừa gỡ (ADR-001 §10): điểm đo bắn ra token bản khai chưa có là tình trạng phải
       hiện lên màn, không phải lỗi — và fixture demo nay cố ý có một token như thế trên chính `sg4`.
       Cái CÒN đúng và đáng canh là chiều bao hàm: mọi giá trị ĐÃ KHAI phải đếm được, thiếu một giá
       trị đã khai mới là dấu hiệu phép cộng bỏ sót. */
    const counted = new Set(rows.map((r) => r.val));
    for (const v of sig.values) expect(counted).toContain(v);
    expect([...counted].filter((v) => !sig.values.includes(v)).length).toBeGreaterThan(0);
  });
});
