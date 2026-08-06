import { describe, expect, it } from "vitest";
import type { CxmData, Evidence, TaxNode } from "../data/schema/index.ts";
import { cfgDefault, seed } from "../data/fixtures/seed.ts";
import {
  coverageGapLine,
  evidenceAtStep,
  intentRowsAtStep,
  quietButVoicedSteps,
  sentimentAtStep,
  themeRowsAtStep,
  voiceCountAtPhase,
} from "./vocJourney.ts";

/* Bốn thứ được canh ở đây, mỗi thứ vì một lý do đã trả giá trong stream này:

   1. "chưa đo" KHÁC "đo rồi, trung tính". Fixture nào cũng đầy đủ thì nhánh `null` không bao giờ
      chạy — một fixture đầy đủ tiện tay là cùng cái bẫy với một fixture nhỏ tiện tay. Nên bước rỗng
      ở đây được DỰNG RA, không đợi seed có sẵn.
   2. Topic gộp theo theme cha: một bằng chứng gắn cả cha lẫn con vẫn là MỘT tiếng nói.
   3. Hai mẫu số không được gộp: `TaxNode.n` (taxonomy khai) và số bằng chứng thật.
   4. "Đối chiếu hai lớp" phải chạy được CẢ HAI nhánh — có bước im lặng, và không có bước nào. */

const ev = (over: Partial<Evidence>): Evidence => ({
  id: "e-x",
  kind: "verbatim",
  src: "sv-nps",
  ref: "REF-000",
  at: "01/06/2026",
  step: "s1",
  pf: "web",
  cat: "complaint",
  sen: 0,
  shift: 0,
  q: "câu mẫu",
  sig: "",
  ck: "KH•••001",
  tax: [],
  why: "dựng cho test",
  ...over,
});

const node = (over: Partial<TaxNode> & Pick<TaxNode, "id" | "lv" | "name">): TaxNode => ({
  parentId: "",
  n: 0,
  why: "dựng cho test",
  up: "01/06/2026",
  by: "test",
  ...over,
});

describe("sentimentAtStep — ba nghĩa của 'không có gì để báo'", () => {
  it("KHÔNG có bằng chứng nào trả null, không trả 0", () => {
    // 0 là một PHÉP ĐO (đã đọc, thấy trung tính). null là CHƯA ĐỌC. Gộp hai cái là để một điểm mù
    // trông y hệt một điểm chạm khoẻ.
    expect(sentimentAtStep([])).toBeNull();
  });

  it("đo được và trung tính thì trả 0, phân biệt hẳn với null", () => {
    expect(sentimentAtStep([ev({ sen: 0.5 }), ev({ sen: -0.5 })])).toBe(0);
  });

  it("lấy trung bình đúng, không làm tròn sớm", () => {
    expect(sentimentAtStep([ev({ sen: -1 }), ev({ sen: -1 }), ev({ sen: 0.5 })])).toBeCloseTo(-0.5, 10);
  });
});

describe("themeRowsAtStep — gộp theo theme cha", () => {
  const data = {
    ...seed,
    tax: [
      node({ id: "t-a", lv: "theme", name: "Xác thực", cat: "complaint", pts: [] }),
      node({ id: "t-a1", lv: "subtheme", name: "NFC không đọc được", parentId: "t-a" }),
      node({ id: "t-a2", lv: "subtheme", name: "VNeID treo", parentId: "t-a" }),
      node({ id: "t-b", lv: "theme", name: "Tốc độ", cat: "complaint", pts: [] }),
    ],
  } as CxmData;

  it("một bằng chứng gắn CẢ cha lẫn con chỉ đếm MỘT lần cho theme cha", () => {
    const rows = themeRowsAtStep(data, [ev({ tax: ["t-a", "t-a1"] })]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.n).toBe(1);
    expect(rows[0]!.kids).toEqual([{ id: "t-a1", name: "NFC không đọc được", n: 1 }]);
  });

  it("gắn hai sub-theme cùng cha vẫn là MỘT tiếng nói ở hàng cha, hai chip con", () => {
    const rows = themeRowsAtStep(data, [ev({ tax: ["t-a1", "t-a2"] })]);
    expect(rows[0]!.n).toBe(1);
    expect(rows[0]!.kids.map((k) => k.id).sort()).toEqual(["t-a1", "t-a2"]);
  });

  it("xếp theo số bằng chứng giảm dần", () => {
    const rows = themeRowsAtStep(data, [
      ev({ id: "e1", tax: ["t-b"] }),
      ev({ id: "e2", tax: ["t-b"] }),
      ev({ id: "e3", tax: ["t-a"] }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(["t-b", "t-a"]);
  });

  it("sub-theme mồ côi (cha không phải theme) đứng thành hàng RIÊNG, không bị bỏ", () => {
    // Bỏ là giấu mất tiếng nói. Đây là dữ liệu vỡ bất biến — phải nhìn thấy được.
    const orphan = {
      ...data,
      tax: [...data.tax, node({ id: "t-mo-coi", lv: "subtheme", name: "Con mồ côi", parentId: "khong-co" })],
    } as CxmData;
    expect(themeRowsAtStep(orphan, [ev({ tax: ["t-mo-coi"] })]).map((r) => r.id)).toEqual(["t-mo-coi"]);
  });

  it("id taxonomy hoàn toàn lạ thì bỏ qua, không dựng hàng ma", () => {
    expect(themeRowsAtStep(data, [ev({ tax: ["khong-ton-tai"] })])).toEqual([]);
  });

  it("không có bằng chứng nào thì không có hàng nào", () => {
    expect(themeRowsAtStep(data, [])).toEqual([]);
  });
});

describe("intentRowsAtStep", () => {
  it("chỉ giữ category CÓ bằng chứng, xếp giảm dần", () => {
    const rows = intentRowsAtStep(seed, [
      ev({ id: "e1", cat: "complaint" }),
      ev({ id: "e2", cat: "complaint" }),
      ev({ id: "e3", cat: "praise" }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(["complaint", "praise"]);
    expect(rows[0]!.n).toBe(2);
  });
});

describe("hai mẫu số không được gộp", () => {
  it("voiceCountAtPhase đếm BẰNG CHỨNG thật, không đọc TaxNode.n", () => {
    const phaseWithTax = seed.tax.find((t) => t.lv === "L1" && t.maps);
    expect(phaseWithTax).toBeDefined();
    const counted = voiceCountAtPhase(seed, phaseWithTax!.maps!);
    // Nếu hàm lỡ đọc `n` thì con số sẽ bằng đúng `n` — canh nó KHÔNG bằng.
    expect(counted).not.toBe(phaseWithTax!.n);
  });

  it("phase chưa instrument: câu chữ nói RA khoảng cách, không im lặng in số taxonomy", () => {
    const empty = seed.phases.find(
      (p) => voiceCountAtPhase(seed, p.id) === 0 && seed.tax.some((t) => t.lv === "L1" && t.maps === p.id),
    );
    expect(empty).toBeDefined();
    const line = coverageGapLine(seed, empty!.id);
    expect(line).toContain("Taxonomy khai");
    expect(line).toContain("chưa bằng chứng mẫu nào xuống được tới mức điểm chạm");
  });

  it("phase đã instrument: câu chữ đặt hai con số cạnh nhau", () => {
    const filled = seed.phases.find((p) => voiceCountAtPhase(seed, p.id) > 0);
    expect(filled).toBeDefined();
    const line = coverageGapLine(seed, filled!.id);
    expect(line).toContain(String(voiceCountAtPhase(seed, filled!.id)));
    expect(line).toContain("xuống được tới mức điểm chạm");
  });
});

describe("quietButVoicedSteps — đối chiếu hai lớp, cả hai nhánh", () => {
  const step = seed.steps[0]!;
  const withObs = (o: { entered: number; completed: number; failed: number; effort: number; cov: number }) => ({
    ...seed,
    obs: [{ stepId: step.id, ...o }, ...seed.obs.filter((x) => x.stepId !== step.id)],
  });
  // fail 1%, effort 1 lần, coverage 100% — dưới mọi ngưỡng của cfgDefault.
  const CALM = { entered: 1000, completed: 990, failed: 10, effort: 1, cov: 100 };

  it("bước MỌI tiêu chí trong ngưỡng mà VẪN có tiếng nói thì bị nêu tên", () => {
    const data = { ...withObs(CALM), ev: [ev({ step: step.id })] } as CxmData;
    expect(quietButVoicedSteps(data, cfgDefault, [step]).map((s) => s.id)).toEqual([step.id]);
  });

  it("bước trong ngưỡng nhưng KHÔNG có tiếng nói thì không bị nêu — đó là bước bình thường", () => {
    const data = { ...withObs(CALM), ev: [] } as CxmData;
    expect(quietButVoicedSteps(data, cfgDefault, [step])).toEqual([]);
  });

  it("bước ĐÃ vượt ngưỡng thì không thuộc nhóm này — hai lớp đang nói cùng một điều", () => {
    const data = {
      ...withObs({ entered: 100, completed: 10, failed: 90, effort: 1, cov: 100 }),
      ev: [ev({ step: step.id })],
    } as CxmData;
    expect(quietButVoicedSteps(data, cfgDefault, [step])).toEqual([]);
  });

  it("bước CHƯA đo hành vi (không có obs) không bị xếp vào 'im lặng' — chưa đo khác đo thấy ổn", () => {
    const data = {
      ...seed,
      obs: seed.obs.filter((o) => o.stepId !== step.id),
      ev: [ev({ step: step.id })],
    } as CxmData;
    expect(quietButVoicedSteps(data, cfgDefault, [step])).toEqual([]);
  });

  it("chạy được trên dữ liệu seed thật, không chỉ trên dữ liệu dựng", () => {
    const flow = seed.flows.find((f) => seed.steps.some((s) => s.flowId === f.id))!;
    const steps = seed.steps.filter((s) => s.flowId === flow.id);
    expect(() => quietButVoicedSteps(seed, cfgDefault, steps)).not.toThrow();
  });
});

describe("evidenceAtStep", () => {
  it("chỉ trả bằng chứng của ĐÚNG bước đó", () => {
    const data = { ...seed, ev: [ev({ id: "a", step: "s1" }), ev({ id: "b", step: "s2" })] } as CxmData;
    expect(evidenceAtStep(data, "s1").map((e) => e.id)).toEqual(["a"]);
  });
});
