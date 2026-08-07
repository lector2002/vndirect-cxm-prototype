import { describe, it, expect } from "vitest";
import { cfgDefault, dims, seed } from "./fixtures/seed.ts";
import { demoData, generateCustomers } from "./fixtures/demo.ts";
import { projectCustomer, projectCustomerBands } from "./projectBands.ts";
import { MockRepository } from "./mock-repository.ts";
import { themeSegments } from "../domain/themeSegments.ts";
import type { Cfg, Dim } from "./schema/index.ts";

/* `tenure` đã rút khỏi `dims`/`cfgDefault.segment.band` (S2, 04/08: chiều không còn cắt chart) —
   nhưng `rawInBand` trong data/fixtures/demo.ts vẫn rút số thô cho `tenureMonths` theo ĐÚNG ranh
   giới cũ (hằng module-local `TENURE_BAND` ở đó). Muốn canh lỗi lệch biên `rawInBand` (mục đích
   của nhóm test dưới) vẫn phải chiếu lại số thô qua một DIM TEST-LOCAL, không phục hồi
   `dims.tenure` ở sản phẩm thật — cùng cách domain/quantify.test.ts đã dùng. */
const TENURE_TEST_ID = "ttenure";
const testDims: Record<string, Dim> = {
  ...dims,
  [TENURE_TEST_ID]: { label: "Thâm niên giao dịch (test)", unit: "nhóm thâm niên", base: "cust", cut: { kind: "band", source: "tenureMonths" } },
};
const testCfg: Cfg = {
  ...cfgDefault,
  segment: { ...cfgDefault.segment, band: { ...cfgDefault.segment.band, [TENURE_TEST_ID]: { min: null, cuts: [6, 24, 60], unit: "tháng" } } },
};

/* Bộ test này kiểm ĐÚNG MỘT điều mà cả suite 716 test trước đó không kiểm được: `cfg.segment.cuts`
   có thật sự điều khiển con số hiện trên chart hay không. Suite cũ xanh vì nó chưa bao giờ ĐỔI một
   cut nào — mà lỗi đo được 04/08 chính là "đổi cut không làm gì cả" (`bandOf` không có consumer nào
   trong production). Nên mọi ca dưới đây đều phải ĐỔI cut rồi đo lại, không chỉ chạy với cut mặc
   định. */

/** Cut sát 0 cho nav — ca dùng owner đã nêu: tách nhóm CHƯA CÓ TÀI SẢN (navVnd = 0) ra khỏi nhóm
    "có ít tài sản". Thêm cut 1 vào đầu ⇒ dải đầu là "0đ", dải kế là "<50tr" (data/bands.ts). */
function cfgWithZeroAssetCut(): Cfg {
  const cfg = structuredClone(cfgDefault);
  cfg.segment.band.nav = { min: null, cuts: [1, 50e6, 200e6, 1e9, 5e9], unit: "đ" };
  return cfg;
}

describe("projectCustomerBands", () => {
  it("phép chiếu là idempotent — nhãn luôn tính từ số thô, không đọc nhãn cũ", () => {
    /* `seed` export đã là bản CHIẾU, nên chiếu thêm lần nữa phải ra y nguyên. Nếu hàm chiếu có lúc
       nào đọc nhãn cũ làm đầu vào thì ca này đỏ. Cặp nhãn/số thô có khớp nhau hay không là việc của
       validate rule 19 (nó tính lại bằng bandOf), đã xanh ở validate.test.ts. */
    expect(projectCustomerBands(seed, cfgDefault, dims)).toEqual(seed);
  });

  it("sentinel của số thô đi qua nguyên vẹn, không bị dải nào hấp thụ", () => {
    const c = seed.cust.find((x) => x.tenureMonths === "chưa-biết")!;
    expect(projectCustomer(c, testCfg, testDims).bands[TENURE_TEST_ID]).toBe("chưa-biết");
    /* KHÔNG được thành "<6 tháng": xếp 'chưa-biết' vào dải thấp nhất là biến "chưa tới chỗ biết
       được" thành "quan hệ mới" — đúng lỗi mà data/segment.ts cấm. */
    expect(projectCustomer(c, testCfg, testDims).bands[TENURE_TEST_ID]).not.toBe("<6 tháng");
  });

  it("đổi cut ⇒ CÙNG số thô rơi sang dải khác", () => {
    const zero = seed.cust.find((c) => c.navVnd === 0)!;
    const small = seed.cust.find((c) => c.navVnd === 12e6)!;

    expect(projectCustomer(zero, cfgDefault, dims).bands.nav).toBe("<50tr");
    expect(projectCustomer(small, cfgDefault, dims).bands.nav).toBe("<50tr");

    const cfg = cfgWithZeroAssetCut();
    expect(projectCustomer(zero, cfg, dims).bands.nav).toBe("0đ");
    // Cùng dải số như trước (chưa đổi cut giữa), nhưng dải đó không còn là dải đáy ⇒ nhãn đổi từ
    // "<50tr" sang "1đ-50tr" (in biên dưới thật, xem bands.ts, sửa 07/08).
    expect(projectCustomer(small, cfg, dims).bands.nav).toBe("1đ-50tr");
  });
});

describe("fixture demo: số thô rút ra phải chiếu lại ĐÚNG nhãn đã rút", () => {
  it("cả 300 khách: bandOf(số thô) === nhãn mà bảng weight chọn", () => {
    /* Ca này canh một lỗi mà validate rule 19 KHÔNG bắt được. Phân bố theo dải của demo do các bảng
       weight quyết định (chủ ý owner); `rawInBand` chỉ hạ nhãn đó xuống một số trong dải. Nếu phép
       rút lệch biên một đơn vị — rút ra đúng `upper` thay vì `upper - 1` — thì phép chiếu gán khách
       đó sang DẢI TRÊN, và rule 19 vẫn xanh vì nó chỉ kiểm nhãn khớp số thô, tức là khớp với cái
       nhãn ĐÃ BỊ dịch. Phân bố demo sẽ lệch âm thầm so với bảng weight.
       `generateCustomers` trả bản CHƯA chiếu (còn giữ nhãn do pickWeighted chọn), nên so được hai
       bên; `demoData` thì đã chiếu rồi, không dùng để kiểm việc này. */
    const raw = generateCustomers(300);
    expect(raw).toHaveLength(300);

    const lech = raw
      .map((c) => ({
        c,
        p: projectCustomer(c, cfgDefault, dims),
        // tenure test-local (S2) — xem TENURE_TEST_ID đầu file: dims/cfgDefault không còn chiều
        // này, chiếu riêng để giữ độ phủ canh lỗi lệch biên rawInBand trên tenureMonths.
        pTenure: projectCustomer(c, testCfg, testDims),
      }))
      .filter(
        ({ c, p, pTenure }) =>
          (["age", "nav"] as const).some((k) => p.bands[k] !== c.bands[k]) ||
          pTenure.bands[TENURE_TEST_ID] !== c.bands.tenure,
      )
      .map(
        ({ c, p, pTenure }) =>
          `${c.key}: age ${c.bands.age}->${p.bands.age} · nav ${c.bands.nav}->${p.bands.nav} · tenure ${c.bands.tenure}->${pTenure.bands[TENURE_TEST_ID]}`,
      );

    expect(lech).toEqual([]);
  });
});

describe("MockRepository.setCfg — cut đổi thì snapshot đổi", () => {
  it("getSnapshot() chiếu lại nhãn theo cfg MỚI, không phải cfg lúc dựng fixture", () => {
    const repo = new MockRepository(demoData);

    const navOf = (key: string) => repo.getSnapshot().cust.find((c) => c.key === key)!.bands.nav;
    expect(navOf("KH•••7A2")).toBe("<50tr"); // navVnd = 0
    expect(navOf("KH•••4B8")).toBe("<50tr"); // navVnd = 12tr — CÙNG dải với 7A2 lúc này

    repo.setCfg({ segment: cfgWithZeroAssetCut().segment });

    expect(navOf("KH•••7A2")).toBe("0đ"); // tách ra được
    // Vẫn ở dải cũ ⇒ hai nhóm đã khác nhau — chỉ đổi NHÃN của dải đó (không còn là dải đáy nên
    // không gộp về "<50tr" nữa, phải in biên dưới thật — xem bands.ts, sửa 07/08).
    expect(navOf("KH•••4B8")).toBe("1đ-50tr");
  });

  it("chart theme chia lại nhóm theo cut mới — nhãn đoạn đổi, Σ vẫn bằng theme.n", () => {
    const repo = new MockRepository(demoData);
    const sumOf = (segs: { n: number }[]) => segs.reduce((a, s) => a + s.n, 0);
    const nOf = (segs: { label: string; n: number }[], l: string) => segs.find((s) => s.label === l)?.n ?? 0;
    const themeN = demoData.tax.find((t) => t.id === "x-th-device")!.n;

    const before = themeSegments(repo.getSnapshot(), "x-th-device", "nav", dims);
    expect(before.map((s) => s.label)).not.toContain("0đ");
    expect(sumOf(before)).toBe(themeN);

    repo.setCfg({ segment: cfgWithZeroAssetCut().segment });

    const after = themeSegments(repo.getSnapshot(), "x-th-device", "nav", dims);
    /* Bằng chứng cuối: một NHÃN MỚI xuất hiện trên chart chỉ vì owner thêm một cut — không sửa dòng
       code nào, không đổi một số thô nào. Đây là điều bản trước section này không làm được. */
    expect(after.map((s) => s.label)).toContain("0đ");
    expect(after.map((s) => s.label)).toContain("1đ-50tr");
    /* Mẫu số KHÔNG được rứt ai: đổi cut chỉ chia lại nhóm, không làm mất hay thêm bằng chứng. */
    expect(sumOf(after)).toBe(themeN);
    /* '<50tr' cũ TÁCH thành '0đ' + '1đ-50tr' — tổng hai nhóm phải bằng đúng nhóm cũ. Dải kế không
       còn là dải đáy nên nhãn đổi từ '<50tr' sang '1đ-50tr' (bands.ts, sửa 07/08). */
    expect(nOf(after, "0đ") + nOf(after, "1đ-50tr")).toBe(nOf(before, "<50tr"));
    /* Và phép tách phải THẬT SỰ tách: cả hai nhóm đều có khách, không phải một nhóm rỗng. */
    expect(nOf(after, "0đ")).toBeGreaterThan(0);
    expect(nOf(after, "1đ-50tr")).toBeGreaterThan(0);
  });

  it("CHẶN (ném) cfg có cuts không tăng dần — state cũ giữ nguyên", () => {
    const repo = new MockRepository(demoData);
    const before = repo.getCfg();
    const bad = structuredClone(cfgDefault);
    bad.segment.band.nav = { min: null, cuts: [200e6, 50e6], unit: "đ" };

    expect(() => repo.setCfg({ segment: bad.segment })).toThrow(/setCfg/);
    expect(repo.getCfg()).toEqual(before);
    expect(repo.validate()).toEqual([]);
  });

  it("validate() vẫn rỗng sau khi đổi cut hợp lệ — nhãn và số thô không lệch nhau", () => {
    const repo = new MockRepository(demoData);
    repo.setCfg({ segment: cfgWithZeroAssetCut().segment });
    /* Nếu getSnapshot/validate quên chiếu theo cfg mới thì nhóm 19 sẽ báo lệch nhãn cho MỌI khách —
       ca này là chốt chặn cho đúng lỗi đó. */
    expect(repo.validate()).toEqual([]);
  });
});
