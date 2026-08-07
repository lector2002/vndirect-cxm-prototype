import { describe, it, expect } from "vitest";
import { generateCustomers, generateEvidence, generateMetricHistory, demoData } from "./demo.ts";
import { dims, seedNav, seedTour, cfgDefault, seed } from "./seed.ts";
import { validateFixture, ANON_CK } from "../validate.ts";
import { UNKNOWN_YET, MISSING } from "../segment.ts";
import { CUST_CAT } from "../rawFields.ts";
import { bandOf } from "../bands.ts";
import { metricDirection } from "../metric-direction.ts";
import type { Customer, AgeBand, NavBand, TenureBand, AcqChannel, TaxNode, CfgBandAxis } from "../schema/index.ts";

/* `tenure` đã rút khỏi `dims` (S2, 04/08): `projectCustomerBands` không còn tính `c.bands.tenure`
   nữa (xem demo.ts:689 — demoData.cust chiếu lại qua `dims` thật trước khi export), nên đọc thẳng
   dữ kiện thô `c.tenureMonths` và tự băng theo ranh giới, giống cách `matchesBias` trong demo.ts đã
   đổi. File này ở tầng data/fixtures (sinh dữ liệu), không phải domain/ (tầng đo) nên đọc raw field
   trực tiếp là được phép. `TENURE_BAND` không export từ demo.ts — lặp lại giá trị tại đây (test tự
   dựng dữ liệu cục bộ), PHẢI khớp nguyên văn `TENURE_BAND` ở demo.ts:166. */
const TENURE_BAND: CfgBandAxis = { min: null, cuts: [6, 24, 60], unit: "tháng" };

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

/* Đọc giá trị của một chiều khách theo id. Hai đường vì hai kiểu chia: `acq` là dữ kiện danh mục đọc
   thẳng, `age`/`nav`/`tenure` là NHÃN NHÓM nằm trong map đã chiếu (xem data/projectBands.ts). */
function valueOf(c: Customer, dimId: string): string {
  if (dimId === "tenure") return bandOf(c.tenureMonths, TENURE_BAND);
  return CUST_CAT[dimId] ? CUST_CAT[dimId](c) : (c.bands[dimId] as string);
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
      const values = demoData.cust.map((c) => valueOf(c, axis));
      const { known, unknown, missing } = counts(values);
      expect(known + unknown + missing).toBe(300);
    }
  });

  /* acq là trục DUY NHẤT còn đủ cả hai loại "không biết" sau 04/08 — trước đó nav cũng có, nhưng owner
     chốt NAV lấy trực tiếp từ tài sản hiện tại nên không còn đường nào để "chưa biết" hay "bị rớt". */
  it("acq: cả ba nhóm known/chưa-biết/thiếu đều > 0 (còn giữ được cả hai loại 'không biết')", () => {
    const values = demoData.cust.map((c) => c.acq as string);
    const { known, unknown, missing } = counts(values);
    expect(known, "acq.known").toBeGreaterThan(0);
    expect(unknown, "acq.unknown").toBeGreaterThan(0);
    expect(missing, "acq.missing").toBeGreaterThan(0);
  });

  it("nav: KHÔNG có sentinel nào — mọi khách đều có dải (chưa có tài sản ⇒ '<50tr')", () => {
    const values = demoData.cust.map((c) => c.bands.nav as string);
    const { known, unknown, missing } = counts(values);
    expect(known).toBe(300);
    expect(unknown).toBe(0);
    expect(missing).toBe(0);
  });

  it("age/tenure: không có ổ 'thiếu' cố ý (chỉ known/chưa-biết) — chỉ acq mới có bug thu thập", () => {
    for (const axis of ["age", "tenure"] as const) {
      const values = demoData.cust.map((c) => valueOf(c, axis));
      const { missing } = counts(values);
      expect(missing, `${axis}.missing`).toBe(0);
    }
  });

  it("mọi AgeBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: AgeBand[] = ["18-24", "25-34", "35-49", "50+"];
    const present = new Set(demoData.cust.map((c) => c.bands.age));
    for (const b of bands) expect(present.has(b), `age band ${b}`).toBe(true);
  });

  it("mọi NavBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: NavBand[] = ["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", "5tỷ+"];
    const present = new Set(demoData.cust.map((c) => c.bands.nav));
    for (const b of bands) expect(present.has(b), `nav band ${b}`).toBe(true);
  });

  it("mọi TenureBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: TenureBand[] = ["<6 tháng", "6-24 tháng", "2-5 năm", "5 năm+"];
    // tenure đã rút khỏi dims (S2) ⇒ c.bands.tenure không còn được tính — băng lại từ c.tenureMonths thô.
    const present = new Set(demoData.cust.map((c) => valueOf(c, "tenure")));
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
      if (c.seg === "Khách 50+") expect(c.bands.age).toBe("50+");
    }
  });

  /* Bất biến C1 cũ ("high-value ⟹ nav không sentinel", chống survivorship bias) nay là tập con của test
     "nav: KHÔNG có sentinel nào" ở trên nên bỏ. Thay bằng điều kiện MẠNH HƠN còn ý nghĩa: high-value
     phải nằm ở dải NAV cao thật (hoặc là khách chuyển từ CTCK khác) — chặn cảnh gán tier tuỳ ý. */
  it("bất biến: tier 'high-value' luôn ở dải NAV cao, hoặc là khách chuyển từ CTCK khác", () => {
    for (const c of demoData.cust) {
      if (c.tier !== "high-value") continue;
      const ok = c.bands.nav === "1-5tỷ" || c.bands.nav === "5tỷ+" || c.seg === "Khách chuyển từ CTCK khác";
      expect(ok, `${c.key}: tier high-value nhưng nav="${c.bands.nav}" seg="${c.seg}"`).toBe(true);
    }
  });

  it("dùng Customer[] không any — khớp type khi ép vào readonly Customer", () => {
    const sample: Customer = demoData.cust[0];
    expect(typeof sample.key).toBe("string");
  });
});

/* Module F, section F2 — bằng chứng demo có khối lượng + ck hợp lệ. seed.ev (17 dòng, giữ nguyên
   không sửa) vẫn còn 7 dòng có ck không tra ra khách (đo lại 04/08: 15 giá trị ck khác nhau, 7
   khớp cust.key, 2 dòng 'Ẩn danh', 7 dòng khoá mồ côi) — đó là luật
   ĐỊNH DẠNG của validateFixture nhóm 21 chấp nhận được (xem validate.test.ts nhóm 21), KHÔNG phải
   thứ nhóm test này kiểm. Test "tra ra được" dưới đây CHỈ áp cho bằng chứng MỚI SINH (id bắt đầu
   'EV-DEMO-') — đây là điểm tôi phải tự quyết vì mô tả gốc nói "mọi ck trong demoData", mà áp
   nguyên văn lên CẢ demoData.ev sẽ luôn đỏ với 8 giá trị mồ côi cũ của seed dù không đụng gì tới
   phần mới sinh (xem "Điểm nghi vấn" trong báo cáo section). */
describe("demoData.ev — bằng chứng demo sinh thêm cho theme (Module F, section F2)", () => {
  const seedEvIds = new Set(seed.ev.map((e) => e.id));
  const generatedEv = demoData.ev.filter((e) => !seedEvIds.has(e.id));

  it("sinh TẤT ĐỊNH — gọi generateEvidence hai lần với cùng input ra cùng kết quả", () => {
    const themes = seed.tax.filter((t): t is TaxNode => t.lv === "theme");
    const a = generateEvidence(themes, demoData.cust);
    const b = generateEvidence(themes, demoData.cust);
    expect(a).toEqual(b);
  });

  it("mọi ck của bằng chứng MỚI SINH không phải 'Ẩn danh' đều tra ra một cust.key thật trong demoData", () => {
    const custKeys = new Set(demoData.cust.map((c) => c.key));
    const unresolved = generatedEv.filter((e) => e.ck !== ANON_CK && !custKeys.has(e.ck));
    expect(unresolved.map((e) => `${e.id}:${e.ck}`)).toEqual([]);
  });

  /* Số bằng chứng/theme KHÔNG còn là một hằng số chung — mẫu số là `theme.n` (bề rộng thanh
     ThemeStackBlock, lệch 210-412 giữa theme), nên luật là COVERAGE=0.7 × theme.n, không phải
     một số tuyệt đối. Ghim ĐÚNG kết quả của luật (không tính nhẩm một số cố định) để test kiểm
     được chính công thức — nếu ai đổi COVERAGE hay cách tính, test này bắt được ngay. */
  it("mỗi theme có ĐÚNG round(theme.n × 0.7) bằng chứng mới sinh — kiểm luật coverage theo theme.n, không phải một số tuyệt đối", () => {
    const themes = seed.tax.filter((t): t is TaxNode => t.lv === "theme");
    for (const theme of themes) {
      const expected = Math.round(theme.n * 0.7);
      const count = generatedEv.filter((e) => e.tax.includes(theme.id)).length;
      expect(count, `theme ${theme.id} (n=${theme.n})`).toBe(expected);
    }
  });

  it("có ít nhất vài bằng chứng 'Ẩn danh' trong phần mới sinh — đủ để đoạn Ẩn danh của chart hiện ra", () => {
    const anonCount = generatedEv.filter((e) => e.ck === ANON_CK).length;
    expect(anonCount).toBeGreaterThan(5);
  });

  it("validateFixture(demoData, dims, nav, tour, cfg) vẫn RỖNG sau khi thêm bằng chứng demo", () => {
    const errors = validateFixture(demoData, dims, seedNav, seedTour, cfgDefault);
    expect(errors).toEqual([]);
  });

  /* Khung bước của bản đồ hành trình là khung THẬT và sẽ dài ra (owner chốt 04/08: "khung của bản đồ
     hành trình là chính xác cho cả bản real... các touchpoint cũng chưa đầy đủ"). Test này chặn đúng
     cái sai âm thầm khi thêm bước: nếu danh sách bước sinh bằng chứng bị ghi cứng lại thành s1..s6
     thì bước thứ 7 sẽ không có bằng chứng nào mà mọi test khác vẫn xanh. */
  it("MỌI bước trong seed.steps đều có bằng chứng sinh — thêm bước vào flow không bị bỏ rơi", () => {
    const covered = new Set(generatedEv.map((e) => e.step));
    const missing = seed.steps.filter((s) => !covered.has(s.id)).map((s) => `${s.id} (${s.code})`);
    expect(missing).toEqual([]);
  });

  /* ---------- F2b: lệch theo theme ----------
     Bản F2 đầu rút `ck` đều từ 300 khách bất kể theme, nên chia theme theo bất kỳ chiều khách nào
     cũng ra ĐÚNG phân bố dân số — mọi theme một hình, và ở theme nhỏ khác biệt duy nhất giữa các
     cột là nhiễu rút thăm. Nhóm test này ghim điều NGƯỢC LẠI phải đúng.
     Cách so: KHÔNG ghim con số tuyệt đối (số đó phụ thuộc p, ANON_RATE và phân bố khách — đổi một
     cái là phải sửa test mà không phát hiện được gì). So tỷ trọng nhóm khớp TRONG theme với tỷ
     trọng nhóm đó TRONG TOÀN DÂN SỐ, tính ngay từ demoData.cust. Đó mới đúng phát biểu cần giữ:
     "theme này tập trung vào nhóm này CAO HƠN mức tự nhiên". */
  const byKey = new Map(demoData.cust.map((c) => [c.key, c]));
  type BiasField = "seg" | "nav" | "acq" | "tenure";

  /* Mẫu số là dòng ĐỐI CHIẾU ĐƯỢC, không phải mọi dòng của theme. Đây KHÔNG phải chỗ vi phạm defect
     D0 (không được lặng lẽ bỏ nhóm không biết ra khỏi mẫu số): D0 ràng buộc con số CHART cho người
     đọc. Chỗ này đang so một phân bố CÓ ĐIỀU KIỆN ("trong số khách tra ra được, bao nhiêu % thuộc
     nhóm X") với chính nó ở mức dân số — mà dân số thì không có dòng ẩn danh nào. Nếu chia cho mọi
     dòng thì 8% ẩn danh trừ đều vào mọi theme và phép so lệch hệ thống ~8-11 điểm: đúng cái đã làm
     test "x-th-status không lệch" đỏ oan ở lần chạy đầu. */
  function shareInTheme(themeId: string, field: BiasField, values: readonly string[]): number {
    const resolved = generatedEv
      .filter((e) => e.tax.includes(themeId))
      .map((e) => byKey.get(e.ck))
      .filter((c): c is Customer => c !== undefined);
    return resolved.filter((c) => values.includes(valueOf(c, field))).length / resolved.length;
  }

  function shareInPopulation(field: BiasField, values: readonly string[]): number {
    return demoData.cust.filter((c) => values.includes(valueOf(c, field))).length / demoData.cust.length;
  }

  /* 4 dòng này là bảng THEME_SKEW của demo.ts phát biểu lại độc lập, không import — nếu ai xoá một
     bias hoặc sai chính tả giá trị enum thì nhóm khớp tụt về mức dân số và test này đỏ. */
  const SKEW_CASES: ReadonlyArray<readonly [string, BiasField, readonly string[]]> = [
    ["x-th-branch", "seg", ["Khách 50+"]],
    ["x-th-start", "tenure", ["<6 tháng"]],
    ["x-th-fee", "nav", ["1-5tỷ", ">5tỷ"]],
    ["x-th-guide", "acq", ["tự tìm", "banner"]],
  ];

  it.each(SKEW_CASES)(
    "theme %s tập trung vào nhóm %s CAO HƠN mức dân số ít nhất 12 điểm phần trăm",
    (themeId, field, values) => {
      const inTheme = shareInTheme(themeId, field, values);
      const inPop = shareInPopulation(field, values);
      expect(
        inTheme - inPop,
        `${themeId}: trong theme ${(100 * inTheme).toFixed(1)}% vs dân số ${(100 * inPop).toFixed(1)}%`,
      ).toBeGreaterThan(0.12);
    },
  );

  /* Mặt còn lại, quan trọng ngang: KHÔNG được lệch ở theme không khai lệch. Nếu mọi theme đều lệch
     thì nút toggle vô nghĩa theo chiều ngược lại — "thanh phẳng" phải còn là một câu trả lời có
     thật. Lấy x-th-status (n=295 ⇒ 207 dòng, đủ lớn để nhiễu nhỏ) và ngưỡng rộng 8 điểm. */
  it("theme KHÔNG khai lệch (x-th-status) giữ đúng phân bố dân số — sai lệch dưới 8 điểm phần trăm", () => {
    for (const [, field, values] of SKEW_CASES) {
      const d = Math.abs(shareInTheme("x-th-status", field, values) - shareInPopulation(field, values));
      expect(d, `x-th-status theo ${field}=${values.join("|")}`).toBeLessThan(0.08);
    }
  });

  /* pf là chiều của BẰNG CHỨNG, không phải của khách (xem comment EV_PF trong demo.ts) nên lệch pf
     đo trực tiếp trên ev, không qua join. x-th-device khai android 0.58 (từ subtheme x-sub-android
     n=238/412), các theme khác dùng EV_PF android 0.40. */
  it("x-th-device có tỷ trọng android cao hơn theme không khai lệch pf", () => {
    const androidShare = (themeId: string): number => {
      const rows = generatedEv.filter((e) => e.tax.includes(themeId));
      return rows.filter((e) => e.pf === "android").length / rows.length;
    };
    expect(androidShare("x-th-device")).toBeGreaterThan(androidShare("x-th-status") + 0.1);
  });
});

/* Module B, section B1 — chuỗi lịch sử chỉ số (`hist`) TRƯỚC mốc đóng băng
   (module-b-issue-charter.md). domain/verifyTimeline.ts (section B2, việc sau) sẽ nối 6 điểm này với
   snap.m.v (đóng băng) + out.post.v (sau) — file này chỉ kiểm phần data/ sinh ra. */
describe("demoData.hist — chuỗi lịch sử chỉ số trước mốc đóng băng (Module B, section B1)", () => {
  it("đúng 5 dòng — một cho mỗi issue có snapshot, KHÔNG có dòng cho CXI-024 (không có snapshot)", () => {
    expect(demoData.hist.length).toBe(5);
    expect(demoData.hist.some((h) => h.iss === "CXI-024")).toBe(false);
    const issIds = demoData.hist.map((h) => h.iss).sort();
    expect(issIds).toEqual(["CXI-013", "CXI-017", "CXI-021", "CXI-026", "CXI-028"].sort());
  });

  it("mỗi dòng: pre có đúng 6 kỳ, demo=true, u khớp snap.m.u của chính issue đó", () => {
    const snapByIss = new Map(seed.snap.map((s) => [s.iss, s]));
    for (const h of demoData.hist) {
      expect(h.pre.length, `${h.iss}.pre.length`).toBe(6);
      expect(h.demo, `${h.iss}.demo`).toBe(true);
      const snap = snapByIss.get(h.iss)!;
      expect(h.u, `${h.iss}.u`).toBe(snap.m.u);
    }
  });

  it("sinh TẤT ĐỊNH — generateMetricHistory(seed.snap, seed.iss, seed.metrics) hai lần cho kết quả giống hệt nhau", () => {
    const a = generateMetricHistory(seed.snap, seed.iss, seed.metrics);
    const b = generateMetricHistory(seed.snap, seed.iss, seed.metrics);
    expect(a).toEqual(b);
  });

  /* Chốt số CỤ THỂ của CXI-013 — pin để đối chiếu chuỗi có dẫn tới mốc đóng băng thật (snap.m.v =
     71,0) hay không. Đổi HIST_SEED hoặc công thức sinh sẽ làm test này đỏ ngay, đúng vai trò một
     chốt chặn (không phải chỉ kiểm hình dạng). */
  it("CXI-013: 6 nhãn kỳ + 6 giá trị PIN, hội tụ về gần snap.m.v = 71,0", () => {
    const h = demoData.hist.find((x) => x.iss === "CXI-013")!;
    expect(h.pre).toEqual([
      { p: "01/2026", v: 78.1 },
      { p: "02/2026", v: 77.2 },
      { p: "03/2026", v: 75.8 },
      { p: "04/2026", v: 73.4 },
      { p: "05/2026", v: 73.0 },
      { p: "06/2026", v: 71.1 },
    ]);
    const snap = seed.snap.find((s) => s.iss === "CXI-013")!;
    expect(snap.m.v).toBe(71.0);
    // Điểm gần mốc đóng băng nhất (kỳ cuối) phải nằm GẦN snap.m.v hơn điểm xa nhất (kỳ đầu).
    expect(Math.abs(h.pre[5].v - snap.m.v)).toBeLessThan(Math.abs(h.pre[0].v - snap.m.v));
  });

  /* CXI-021 và CXI-026 trưng CÙNG một số liệu (metric m-liveness, snap.m.v=83.3, cùng cửa sổ đo,
     cùng obs) — hạt giống khoá theo NỘI DUNG đo (không theo vị trí trong `snaps`), nên hai issue này
     PHẢI ra đúng cùng 6 điểm minh hoạ; nếu không, hai màn "Điểm gãy" khác nhau sẽ minh hoạ hai chiều
     diễn biến ngược nhau cho cùng một chỉ số — tự mâu thuẫn trong chính data demo. */
  /* CHỐT CHẶN chống hồi quy — defect đo được 07/08 và đã sửa: bản đầu RÚT NGẪU NHIÊN chiều của chuỗi
     (`rng() < 0.5 ? 1 : -1`), làm CXI-013 ra 63 → 71,1 tiến tới mốc đóng băng 71,0, tức biểu đồ nói
     chỉ số đang TỐT DẦN rồi bỗng bị ghi nhận là điểm gãy — tự mâu thuẫn với lý do điểm gãy tồn tại.
     Tệ hơn: test pin lúc đó khoá đúng chuỗi sai đó lại, đúng khuôn "tiêu chí nghiệm thu khoá cái sai"
     đã ghi ở mục Bài học đắt nhất. Test này canh LUẬT chứ không canh giá trị, nên nó vẫn bắt được kể
     cả khi ai đó đổi HIST_SEED hay công thức sinh. */
  it("MỌI chuỗi đều đi từ chỗ đỡ xấu VỀ mốc đóng băng, theo đúng metricDirection — không dòng nào kể ngược", () => {
    for (const h of demoData.hist) {
      const iss = seed.iss.find((i) => i.id === h.iss)!;
      const metric = seed.metrics.find((m) => m.id === iss.metric)!;
      const dir = metricDirection(metric);
      const first = h.pre[0].v;
      const last = h.pre[h.pre.length - 1].v;
      // hướng LÊN (cao hơn là tốt) ⇒ chuỗi phải GIẢM; hướng XUỐNG ⇒ chuỗi phải TĂNG.
      if (dir === "up") expect(last, `${h.iss} (${metric.id}, hướng lên) phải xấu dần`).toBeLessThan(first);
      else expect(last, `${h.iss} (${metric.id}, hướng xuống) phải xấu dần`).toBeGreaterThan(first);
    }
  });

  it("hai issue trùng số liệu (CXI-021, CXI-026, cùng metric m-liveness) ra CÙNG một chuỗi hist", () => {
    const h1 = demoData.hist.find((x) => x.iss === "CXI-021")!;
    const h2 = demoData.hist.find((x) => x.iss === "CXI-026")!;
    expect(h1.pre).toEqual(h2.pre);
  });

  it("validateFixture(demoData, dims, nav, tour, cfg) vẫn RỖNG sau khi có hist", () => {
    const errors = validateFixture(demoData, dims, seedNav, seedTour, cfgDefault);
    expect(errors).toEqual([]);
  });

  /* CHỐT CHẶN PHÒNG NGỪA (không phải bằng chứng "không lệch" — số ghim dưới đây lấy từ CHÍNH lần
     chạy sau khi thêm hist, nên tự nó không chứng minh gì thay đổi hay không). Bằng chứng thật nằm ở
     hai chỗ: (1) HIST_SEED là stream mulberry32 hoàn toàn mới, generateMetricHistory() không đụng tới
     DEMO_SEED/RAW_SEED/DEMO_EV_SEED/SIG_SEED và chạy SAU khi demoCust/demoEv/demoFires đã tính xong
     (xem vị trí khai báo trong demo.ts); (2) toàn bộ 1100+ test CŨ (không sửa) vẫn xanh, kể cả các
     chốt ghim khác dựa trên demoData.cust (ví dụ so khớp 300 khách ở projectBands, sigCounts) — nếu
     stream bị lệch, các chốt đó sẽ đỏ trước. Test này chỉ là RÀO CHẮN cho tương lai: nếu sau này ai
     sửa lại demo.ts mà vô tình rút thêm số từ stream cust, con số ghim ở đây sẽ đỏ ngay. */
  it("[rào chắn tương lai] demoData.cust: vẫn 300 khách, đúng phân bố acq đã ghim", () => {
    expect(demoData.cust.length).toBe(300);
    const acqCounts: Record<string, number> = {};
    for (const c of demoData.cust) {
      const k = String(c.acq);
      acqCounts[k] = (acqCounts[k] ?? 0) + 1;
    }
    expect(acqCounts).toEqual({
      banner: 60,
      "tự tìm": 62,
      "giới thiệu": 60,
      "đối tác": 42,
      "chi nhánh": 59,
      "thiếu": 9,
      "chưa-biết": 8,
    });
  });
});
