import { describe, expect, it } from "vitest";
import type { CxmData, Evidence, Metric, Signal, Source, Survey, TaxNode } from "../data/schema/index.ts";
import { cfgDefault, seed } from "../data/fixtures/seed.ts";
import { demoData } from "../data/fixtures/demo.ts";
import {
  brokenImpacts,
  continuityCount,
  distByPhase,
  distByPlatform,
  distBySentiment,
  distByTheme,
  freshnessCount,
  instrumentedCount,
  lagText,
  metricsAtRisk,
  ownersAtRisk,
  passiveActive,
  senBucket,
  sourcesByProblem,
  surveyCounts,
  surveysByProblem,
  unhealthySources,
  worstSource,
} from "./sources.ts";
import { sourceHealth } from "./state.ts";

/* Ca rỗng và ca nhiều-nguồn-hỏng KHÔNG dựng được từ demoData (7 nguồn cố định, đúng 1 trễ + 1 đứt),
   nên phần lớn test ở đây dựng dữ liệu tổng hợp. Vài test cuối đối chiếu với `demoData` để bắt
   trường hợp hàm đúng trên đồ chơi mà sai trên bộ dữ liệu màn thật đang render. */

/* 07/08 (module-i-signal-registry-charter.md I3 Việc 1): sức khoẻ nguồn giờ suy từ `last` so
   `asOf` (data.asOf ở đây LUÔN là seed.asOf = "27/07/2026", vì `mk()` spread `...seed`), KHÔNG còn
   từ `lagH`/`cfg.source[id]`. Mặc định `last` = CÙNG NGÀY asOf ⇒ nguồn mặc định LUÔN "ok" — test
   nào cần nguồn trễ/chết phải override `last` tường minh (không override `lagH` — trường đó giờ chỉ
   còn ảnh hưởng `brokenImpacts.days`/`lagText`, không ảnh hưởng hạng sức khoẻ). */
const src = (over: Partial<Source> & Pick<Source, "id">): Source => ({
  name: over.id,
  kind: "event",
  vol: 100,
  lagH: 1,
  last: "27/07 · 09:00",
  metrics: [],
  pf: [],
  voice: false,
  note: "",
  ...over,
});

const metric = (id: string, owner: string): Metric => ({
  id,
  name: `Chỉ số ${id}`,
  value: "50%",
  target: "≥ 60%",
  unit: "%",
  grain: "khách",
  formula: "a ÷ b",
  source: "tổng hợp",
  freshness: "Snapshot",
  owner,
});

const ev = (over: Partial<Evidence> & Pick<Evidence, "id">): Evidence => ({
  kind: "verbatim",
  src: "s1",
  ref: "REF-1",
  at: "01/06 · 09:00",
  step: "st1",
  pf: "ios",
  cat: "complaint",
  sen: -0.5,
  shift: 0,
  q: "câu mẫu",
  sig: "sg1",
  // Đã che sẵn ở tầng dữ liệu — test cũng không dựng giá trị chưa che.
  ck: "KH•••001",
  tax: [],
  why: "",
  ...over,
});

const sig = (id: string, st: Signal["st"]): Signal => ({
  id,
  tpId: "tp1",
  name: id,
  st,
  pf: [],
  es: "",
  vol: 0,
  seen: null,
  metrics: [],
  desc: "",
  values: [],
});

const survey = (over: Partial<Survey> & Pick<Survey, "id">): Survey => ({
  name: over.id,
  type: "CES",
  trigger: "t",
  cond: "c",
  cd: 14,
  scale: "1-5",
  target: "≥ 4",
  latest: "3,8",
  rr: 30,
  n: 100,
  status: "running",
  state: "ok",
  ...over,
});

const tax = (id: string, lv: TaxNode["lv"], name: string): TaxNode => ({
  id,
  lv,
  name,
  parentId: "",
  n: 0,
  why: "",
  up: "01/06/2026",
  by: "test",
});

function mk(over: Partial<CxmData>): CxmData {
  return { ...seed, sources: [], metrics: [], surveys: [], signals: [], ev: [], tax: [], ...over };
}

/* `cfgWith(source)` (SLA riêng từng id tổng hợp) BỎ 07/08 — `sourceHealth()` không còn đọc
   `cfg.source[id]` (I3 Việc 1), nên nó thành hàm không mang thông tin nào; mọi test dưới đây dùng
   thẳng `cfgDefault`. */

describe("sourcesByProblem — nguồn hỏng lên đầu, phần còn lại giữ nguyên thứ tự khai", () => {
  it("xếp nguồn trễ lên trước nguồn đang nhận", () => {
    // thiếu 1 ngày (26/07 so asOf 27/07/2026), vol>0 (mặc định 100) → "stale".
    const data = mk({ sources: [src({ id: "ok1" }), src({ id: "late", last: "26/07 · 09:00" }), src({ id: "ok2" })] });
    const cfg = cfgDefault;
    expect(sourcesByProblem(data, cfg).map((s) => s.id)).toEqual(["late", "ok1", "ok2"]);
  });

  it("hai nguồn cùng khoẻ thì giữ đúng thứ tự khai — không xáo lại sau lưng người dựng dữ liệu", () => {
    const data = mk({ sources: [src({ id: "a" }), src({ id: "b" }), src({ id: "c" })] });
    const cfg = cfgDefault;
    expect(sourcesByProblem(data, cfg).map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
});

describe("Ba phép đếm toàn vẹn — ba thước khác nhau, không được đọc lẫn", () => {
  /* Nguồn đứt hẳn cũng thoả điều kiện "thiếu ≥ deadDays ngày". Nếu `freshnessCount` đếm nó là trễ
     thì một nguồn bị trừ ở CẢ HAI ô, và người đọc thấy hai vấn đề trong khi chỉ có một. */
  it("nguồn ĐỨT không bị đếm thêm một lần vào ô độ tươi", () => {
    // thiếu 56 ngày (01/06 so asOf 27/07/2026) ≥ deadDays 2 → "down".
    const data = mk({ sources: [src({ id: "ok" }), src({ id: "dead", last: "01/06 · 09:00" })] });
    const cfg = cfgDefault;
    expect(freshnessCount(data, cfg)).toEqual({ n: 2, of: 2, unit: "nguồn" });
    expect(continuityCount(data, cfg)).toEqual({ n: 1, of: 2, unit: "nguồn" });
  });

  it("nguồn TRỄ (chưa đứt) trừ ở ô độ tươi, không trừ ở ô tính liên tục", () => {
    const data = mk({ sources: [src({ id: "late", last: "26/07 · 09:00" })] });
    const cfg = cfgDefault;
    expect(freshnessCount(data, cfg).n).toBe(0);
    expect(continuityCount(data, cfg).n).toBe(1);
  });

  /* Đơn vị là phần NỘI DUNG của phép đếm, không phải nhãn trang trí: ô này đếm điểm đo trong khi
     hai ô cạnh nó đếm nguồn, và cả ba cùng hiện dạng "N/M". */
  it("ô độ phủ mang đơn vị 'điểm đo', KHÁC hẳn hai ô đếm nguồn", () => {
    const data = mk({
      sources: [src({ id: "a" })],
      signals: [sig("g1", "live"), sig("g2", "gap"), sig("g3", "designed"), sig("g4", "validating")],
    });
    const cfg = cfgDefault;
    expect(instrumentedCount(data)).toEqual({ n: 2, of: 4, unit: "điểm đo" });
    expect(instrumentedCount(data).unit).not.toBe(freshnessCount(data, cfg).unit);
  });
});

describe("passiveActive — không có khảo sát thì nói là không, đừng chia cho 1", () => {
  it("trả null khi chưa nguồn khảo sát nào, KHÔNG trả nguyên tổng thụ động", () => {
    const data = mk({ sources: [src({ id: "a", kind: "event", vol: 5000 })] });
    const r = passiveActive(data);
    expect(r.ratio).toBeNull();
    expect(r.passive).toBe(5000);
    expect(r.active).toBe(0);
  });

  it("có khảo sát thì tỷ lệ là thương thật", () => {
    const data = mk({
      sources: [src({ id: "a", kind: "event", vol: 900 }), src({ id: "s", kind: "survey", vol: 100 })],
    });
    expect(passiveActive(data).ratio).toBe(9);
  });
});

describe("brokenImpacts — dữ kiện đủ để viết câu cảnh báo, không kèm phán đoán", () => {
  /* `last` điều khiển HẠNG sức khoẻ (thiếu ≥ deadDays 2 ngày → "down"); `lagH` giữ nguyên vai trò
     RIÊNG của nó — chỉ còn nuôi `.days` (`floor(lagH/24)`) và `lagText`, KHÔNG còn ảnh hưởng hạng.
     Hai trường tách bạch từ 07/08 (I3 Việc 1), ghim cả hai để lộ ngay nếu ai gộp lại. */
  it("quy lagH ra số ngày trọn vẹn — độc lập với hạng sức khoẻ (suy từ last/asOf)", () => {
    const data = mk({ sources: [src({ id: "z", lagH: 192, last: "01/06 · 09:00" })] });
    const [b] = brokenImpacts(data, cfgDefault);
    expect(b?.days).toBe(8);
    expect(b?.health).toBe("down");
  });

  /* Ca thật trong demoData: `src-store` và `src-broker` không nối chỉ số nào. Mảng rỗng ở đây có
     nghĩa RIÊNG — nguồn hỏng nhưng không con số nào lệch theo — nên phải phân biệt được với ca
     "nguồn hỏng và kéo theo chỉ số". */
  it("nguồn hỏng mà không nối chỉ số nào thì `metrics` rỗng, không phải thiếu dữ liệu", () => {
    const data = mk({ sources: [src({ id: "z", last: "01/06 · 09:00", metrics: [] })], metrics: [metric("m1", "A")] });
    expect(brokenImpacts(data, cfgDefault)[0]?.metrics).toEqual([]);
  });

  it("chỉ số ăn HAI nguồn cùng hỏng vẫn chỉ đếm một lần", () => {
    const data = mk({
      sources: [
        src({ id: "z1", last: "01/06 · 09:00", metrics: ["m1"] }),
        src({ id: "z2", last: "01/06 · 09:00", metrics: ["m1"] }),
      ],
      metrics: [metric("m1", "CS Center")],
    });
    const cfg = cfgDefault;
    expect(unhealthySources(data, cfg)).toHaveLength(2);
    expect(metricsAtRisk(data, cfg)).toHaveLength(1);
    expect(ownersAtRisk(data, cfg)).toEqual(["CS Center"]);
  });

  it("không nguồn nào hỏng thì không có dữ kiện nào để viết cảnh báo", () => {
    const data = mk({ sources: [src({ id: "a" })] });
    expect(brokenImpacts(data, cfgDefault)).toEqual([]);
    expect(metricsAtRisk(data, cfgDefault)).toEqual([]);
  });
});

/* `lagText` và `brokenImpacts` cùng quy `lagH` ra ngày, ở hai chỗ khác nhau — nếu một bên đổi cách
   làm tròn thì bảng nói "trễ 7 ngày" trong khi câu cảnh báo bên dưới nói "8 ngày". Ghim cả hai. */
describe("lagText — độ trễ đọc bằng chữ", () => {
  it("dưới một ngày thì đơn vị là giờ", () => {
    expect(lagText(3)).toBe("trễ 3 giờ");
    expect(lagText(23)).toBe("trễ 23 giờ");
  });

  it("tròn ngày thì không kèm phần giờ thừa", () => {
    expect(lagText(24)).toBe("trễ 1 ngày");
    expect(lagText(192)).toBe("trễ 8 ngày");
  });

  it("lẻ giờ thì nói đủ cả hai, không nuốt phần dư", () => {
    expect(lagText(25)).toBe("trễ 1 ngày 1 giờ");
    expect(lagText(50)).toBe("trễ 2 ngày 2 giờ");
  });

  it("cùng số ngày với brokenImpacts trên cùng một lagH", () => {
    const data = mk({ sources: [src({ id: "z", lagH: 50, last: "01/06 · 09:00" })] });
    const [b] = brokenImpacts(data, cfgDefault);
    expect(lagText(50)).toContain(`${b!.days} ngày`);
  });
});

describe("Phân bố trên tập bằng chứng mẫu", () => {
  it("sắc thái giữ THỨ TỰ THANG (tiêu cực → tích cực), không xếp theo số đếm", () => {
    const evs = [
      ev({ id: "e1", sen: 0.8 }),
      ev({ id: "e2", sen: 0.8 }),
      ev({ id: "e3", sen: 0.8 }),
      ev({ id: "e4", sen: -0.8 }),
    ];
    expect(distBySentiment(evs).map((r) => r.id)).toEqual(["neg", "pos"]);
  });

  it("nhóm sắc thái KHÔNG có bằng chứng nào thì vắng mặt, không hiện thanh 0", () => {
    expect(distBySentiment([ev({ id: "e1", sen: 0 })]).map((r) => r.id)).toEqual(["neu"]);
  });

  it("ranh giới ±0,2 thuộc về hai đầu thang, không thuộc trung tính", () => {
    expect(senBucket(-0.2)).toBe("neg");
    expect(senBucket(0.2)).toBe("pos");
    expect(senBucket(-0.19)).toBe("neu");
    expect(senBucket(0.19)).toBe("neu");
  });

  /* Một bằng chứng gắn hai node cùng tầng vẫn là MỘT tiếng nói. Cộng hai lần thì tổng các thanh
     vượt số bằng chứng thật, và mẫu số in ở dải trên đầu card không còn khớp với chart dưới nó. */
  it("một bằng chứng gắn hai theme chỉ đóng góp một lần cho cả phân bố", () => {
    const data = mk({ tax: [tax("t1", "theme", "Theme 1"), tax("t2", "theme", "Theme 2")] });
    const rows = distByTheme(data, [ev({ id: "e1", tax: ["t1", "t2"] })]);
    expect(rows.reduce((a, r) => a + r.v, 0)).toBe(1);
  });

  it("phase chỉ đọc node tầng L1, bỏ qua theme gắn kèm", () => {
    const data = mk({ tax: [tax("p1", "L1", "Phase 1"), tax("t1", "theme", "Theme 1")] });
    expect(distByPhase(data, [ev({ id: "e1", tax: ["t1", "p1"] })]).map((r) => r.l)).toEqual(["Phase 1"]);
  });

  it("id taxonomy không tồn tại thì không sinh hàng ma", () => {
    const data = mk({ tax: [tax("t1", "theme", "Theme 1")] });
    expect(distByTheme(data, [ev({ id: "e1", tax: ["khong-co"] })])).toEqual([]);
  });

  it("nền tảng đọc tên đẹp, giá trị lạ giữ nguyên chứ không bỏ", () => {
    const rows = distByPlatform([ev({ id: "e1", pf: "ios" }), ev({ id: "e2", pf: "kiosk" })]);
    expect(rows.map((r) => r.l).sort()).toEqual(["iOS", "kiosk"]);
  });
});

describe("Khảo sát", () => {
  it("'chưa đạt mục tiêu' chỉ đếm khảo sát ĐANG CHẠY — đã dừng thì đó là hệ quả của việc dừng", () => {
    const data = mk({
      surveys: [
        survey({ id: "a", status: "running", state: "watch" }),
        survey({ id: "b", status: "paused", state: "unknown" }),
        survey({ id: "c", status: "running", state: "ok" }),
      ],
    });
    expect(surveyCounts(data)).toEqual({ running: 2, paused: 1, offTarget: 1 });
  });

  it("xếp đã dừng lên đầu, rồi đang chạy mà chưa đạt", () => {
    const data = mk({
      surveys: [
        survey({ id: "ok", state: "ok" }),
        survey({ id: "watch", state: "watch" }),
        survey({ id: "paused", status: "paused" }),
      ],
    });
    expect(surveysByProblem(data).map((s) => s.id)).toEqual(["paused", "watch", "ok"]);
  });
});

describe("Đối chiếu với demoData — bộ dữ liệu màn thật đang render", () => {
  it("đúng hai nguồn đang có vấn đề, và cả hai đều kéo theo chỉ số", () => {
    const impacts = brokenImpacts(demoData, cfgDefault);
    expect(impacts).toHaveLength(2);
    for (const b of impacts) expect(b.metrics.length).toBeGreaterThan(0);
  });

  /* Bằng chứng mẫu của một nguồn KHÁC HẲN volume nguồn đó khai — cùng cái bẫy hai mẫu số ở
     #/vocjourney. Ghim để không ai lặng lẽ đổi chart sang đếm trên `vol`. */
  it("tổng các thanh của một phân bố bằng đúng số bằng chứng mẫu, KHÔNG bằng Source.vol", () => {
    const s = demoData.sources.find((x) => x.id === "src-ga")!;
    const evs = demoData.ev.filter((e) => e.src === s.id);
    expect(distBySentiment(evs).reduce((a, r) => a + r.v, 0)).toBe(evs.length);
    expect(evs.length).toBeLessThan(s.vol);
  });

  it("ba phép đếm toàn vẹn không cùng mẫu số, nên không được đọc cạnh nhau như một thước", () => {
    expect(freshnessCount(demoData, cfgDefault).of).toBe(demoData.sources.length);
    expect(instrumentedCount(demoData).of).toBe(demoData.signals.length);
    expect(instrumentedCount(demoData).of).not.toBe(freshnessCount(demoData, cfgDefault).of);
  });
});

/* F7 (charter §7, I3) — "nguồn xấu nhất" khi một chỉ số có nhiều nguồn: xấu nhất theo HẠNG sức
   khoẻ (`chết > đang trễ > im lặng chưa phân định > đang nhận`), KHÔNG theo số ngày thiếu. Đo 07/08:
   fixture hôm nay CHỈ 1/6 chỉ số có >1 nguồn (`m-repeat`), và nguồn xấu nhất của nó CŨNG là nguồn
   thiếu nhiều ngày nhất — tức fixture không phân biệt được "hạng" với "số ngày thiếu". Test dưới
   TỰ DỰNG input để tách hai tiêu chí đó. */
describe("worstSource — F7: chọn theo HẠNG sức khoẻ, không theo số ngày thiếu", () => {
  it("nguồn thiếu ÍT ngày hơn nhưng hạng XẤU HƠN (stale > silent) phải thắng", () => {
    const asOf = "10/08/2026";
    const cfg = { ...cfgDefault, data: { ...cfgDefault.data, deadDays: 5 } };
    // thiếu 2 ngày, vol>0 → "stale".
    const a = src({ id: "a", kind: "event", vol: 100, last: "08/08 · 00:00" });
    // thiếu 3 ngày (NHIỀU hơn a), vol=0, kind='survey' (người chủ động gửi) → "silent" — hạng NHẸ
    // hơn "stale" dù thiếu nhiều ngày hơn.
    const b = src({ id: "b", kind: "survey", vol: 0, last: "07/08 · 00:00" });
    expect(sourceHealth(a, cfg, asOf)).toBe("stale");
    expect(sourceHealth(b, cfg, asOf)).toBe("silent");
    expect(worstSource([a, b], cfg, asOf)?.id).toBe("a");
    expect(worstSource([b, a], cfg, asOf)?.id).toBe("a"); // thứ tự truyền vào không quyết định
  });

  it("đồng hạng thì nguồn thiếu NHIỀU NGÀY hơn thắng", () => {
    const asOf = "10/08/2026";
    const cfg = { ...cfgDefault, data: { ...cfgDefault.data, deadDays: 5 } };
    const c = src({ id: "c", last: "31/07 · 00:00" }); // thiếu 10 ngày → "down"
    const d = src({ id: "d", last: "04/08 · 00:00" }); // thiếu 6 ngày → "down"
    expect(sourceHealth(c, cfg, asOf)).toBe("down");
    expect(sourceHealth(d, cfg, asOf)).toBe("down");
    expect(worstSource([c, d], cfg, asOf)?.id).toBe("c");
  });

  it("danh sách rỗng → undefined", () => {
    expect(worstSource([], cfgDefault, seed.asOf)).toBeUndefined();
  });
});

/* D1 (charter §5, I3) — `metricFreshnessText()` ĐÃ XOÁ 11/08 cùng bộ test của nó: hàm sinh chuỗi
   ba đoạn mà luật giao diện 11/08 cấm, và sau khi bỏ dòng độ tươi khỏi bảng chỉ số thì không còn ai
   gọi. Xem docblock chỗ xoá trong `sources.ts`. D1 vẫn đạt theo hướng khác: bảng chỉ số không khai gì
   về độ tươi thay vì khai một chuỗi gõ tay sai số. */
