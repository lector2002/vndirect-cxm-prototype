import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { dims } from "../data/fixtures/seed.ts";
import { NOT_IDENTIFIED, SIG_CUST_DIMS, SIG_FIRE_DIM, type SigCount } from "../data/projectSignalCounts.ts";
import { UNKNOWN_YET } from "../data/segment.ts";
import type { Signal } from "../data/schema/index.ts";
import { signalChart } from "./signalChart.ts";

/* Signal tối giản cho các ca cần dữ liệu KHÔNG có trong fixture thật (giá trị chưa khai, chiều
   thiếu/đủ một phần...) — chỉ set field cần cho từng test, còn lại giá trị trung tính. */
function makeSignal(overrides: Partial<Signal> & { id: string; vol: number; values: string[] }): Signal {
  return {
    tpId: "tp-x",
    instAt: null,
    name: overrides.id,
    st: "live",
    pf: ["ios"],
    es: "client",
    seen: null,
    srcId: null,
    metrics: [],
    desc: "",
    ...overrides,
  };
}

const sumTotals = (cols: { total: number }[]) => cols.reduce((a, c) => a + c.total, 0);

/* Đối chiếu với SỐ THẬT của fixture, tính độc lập từ `sigCounts` ngay trong test — không lấy lại
   con số do chính `signalChart` trả ra. Ba ca này pin đúng ba chỗ dễ trôi nhất về sau. */
describe("signalChart — đối chiếu số thật của fixture", () => {
  /* Rule 6 neo vào một con số có thật: sg4 = 125/410 lần bắn chưa gắn được khách (30,5%), đúng ví dụ
     minh hoạ trong thiết kế §1. Xem TỪ chiều `sigpf` — chiều được MIỄN ràng buộc 3 — mà vẫn phải ra
     đúng 125, vì "chưa gắn được khách" là thuộc tính của signal, không phải của chiều đang xem. */
  it("sg4 xem từ chiều sigpf vẫn ra đúng 125/410 chưa gắn được khách", () => {
    const g = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg4"], "sigpf").groups[0];
    const doiChieu = demoData.sigCounts
      .filter((r) => r.sig === "sg4" && r.dim === "acq" && r.band === NOT_IDENTIFIED)
      .reduce((a, r) => a + r.n, 0);

    expect(g.vol).toBe(410);
    expect(doiChieu).toBe(125);
    expect(g.notIdentified).toBe(doiChieu);
    expect(g.notIdentifiedPct).toBeCloseTo(125 / 410, 12);
  });

  /* Ba signal cùng có giá trị `success` — CẤM gộp. Mỗi nhóm phải giữ số của chính nó, và ba số đó
     không được bằng nhau cả ba (nếu bằng nhau thì test không chứng minh được gì). */
  it("sg3/sg5/sg8 cùng có 'success': ba cột riêng, mỗi cột đúng số của chính nó", () => {
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg8", "sg5", "sg3"], "acq");
    expect(chart.groups.map((g) => g.sigId)).toEqual(["sg3", "sg5", "sg8"]); // thứ tự khai báo

    const totals = chart.groups.map((g) => {
      const col = g.cols.find((c) => c.val === "success");
      expect(col).toBeDefined();
      const doiChieu = demoData.sigCounts
        .filter((r) => r.sig === g.sigId && r.dim === "acq" && r.val === "success")
        .reduce((a, r) => a + r.n, 0);
      expect(col!.total).toBe(doiChieu);
      return col!.total;
    });

    expect(new Set(totals).size).toBeGreaterThan(1);
  });

  /* Ghi lại một giới hạn của bản demo, để đừng ai đi tìm trạng thái 2/3 trên màn hình: dữ liệu demo
     ghi ĐỦ cả năm chiều, nên mọi nút chiều đứng ở trạng thái "full". Trạng thái "partial"/"locked"
     chỉ phủ được bằng fixture dựng tay (các test rule 7 ở dưới). */
  it("dữ liệu demo: cả năm chiều đều 'full' — trạng thái 2/3 không bấm ra được", () => {
    const live = demoData.signals.filter((s) => s.vol > 0).map((s) => s.id);
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, live, "acq");
    expect(chart.dimStates.map((d) => d.id)).toEqual(["acq", "nav", "age", "tier", "sigpf"]);
    expect(chart.dimStates.every((d) => d.state === "full")).toBe(true);
  });
});

describe("signalChart — chiều lạ phải NÉM, không được lặng lẽ ra tổng 0", () => {
  /* Guard thêm sau khi review phép chiếu: `tenure` đã bị RÚT khỏi `dims` ở S2. Truyền nó vào thì mọi
     cột lọc ra rỗng và nhóm hiện tổng 0 trong khi `Signal.vol` là 410 — đọc thành "đã đo, ra 0",
     đúng lời bịa mà rule 2 chặn ở signal `vol===0`, chỉ vào bằng cửa khác. Phải đỏ ngay lần gọi đầu,
     cùng khuôn với lỗi chiều thiếu trong `dims`. */
  it("chiều đã rút khỏi dims (tenure) ⇒ ném lỗi khai báo", () => {
    expect(() => signalChart(demoData.sigCounts, demoData.signals, dims, ["sg4"], "tenure")).toThrow(
      /không phải một trong năm chiều/,
    );
  });

  it("chiều không tồn tại ở đâu cả ⇒ cũng ném", () => {
    expect(() => signalChart(demoData.sigCounts, demoData.signals, dims, ["sg4"], "khong-co-that")).toThrow(
      /không phải một trong năm chiều/,
    );
  });

  /* Không vacuous: guard phải KHÔNG chặn oan cả năm chiều thật. */
  it("năm chiều hợp lệ đều không ném", () => {
    for (const dimId of ["acq", "nav", "age", "tier", "sigpf"]) {
      expect(() => signalChart(demoData.sigCounts, demoData.signals, dims, ["sg4"], dimId)).not.toThrow();
    }
  });
});

describe("signalChart — rule 1: cột đúng thứ tự khai báo, không theo thứ tự chọn", () => {
  it("Σ total các cột của MỘT nhóm bằng đúng Signal.vol, trên nhiều signal thật × nhiều chiều", () => {
    for (const dimId of ["nav", "tier", "age", "acq", "sigpf"]) {
      const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg1", "sg3", "sg5", "sg8", "sg10"], dimId);
      for (const group of chart.groups) {
        expect(sumTotals(group.cols)).toBe(group.vol);
      }
    }
  });

  it("nhóm ra ĐÚNG THỨ TỰ khai báo trong `signals`, không theo thứ tự trong selectedSigIds", () => {
    // sg8 khai TRƯỚC sg3 trong mảng gọi, nhưng sg3 khai TRƯỚC sg8 trong seed.signals.
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg8", "sg3"], "nav");
    expect(chart.groups.map((g) => g.sigId)).toEqual(["sg3", "sg8"]);
  });
});

describe("signalChart — rule 3: KHÔNG merge cột cùng tên giữa các signal khác nhau", () => {
  it("sg3 và sg5 đều có cột 'success' nhưng là hai nhóm riêng, tổng khác nhau", () => {
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg3", "sg5"], "nav");
    expect(chart.groups.map((g) => g.sigId)).toEqual(["sg3", "sg5"]);

    const [g3, g5] = chart.groups;
    const success3 = g3.cols.find((c) => c.val === "success");
    const success5 = g5.cols.find((c) => c.val === "success");
    expect(success3).toBeDefined();
    expect(success5).toBeDefined();
    expect(success3!.total).not.toBe(success5!.total);
  });
});

describe("signalChart — rule 2: signal vol===0 ra note, KHÔNG ra nhóm rỗng", () => {
  // 05/08: `sg6` (gap) đã bỏ khỏi seed — chiều Nền tảng trả lời sẵn câu nó định hỏi. Đổi sang
  // `sg-nap-4`, cũng gap vol 0; hành vi được kiểm không đổi một chút nào.
  it("chọn riêng một signal gap (sg-nap-4): notes có, groups rỗng, dimStates rỗng", () => {
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg-nap-4"], "nav");
    expect(chart.groups).toEqual([]);
    expect(chart.dimStates).toEqual([]);
    expect(chart.notes).toHaveLength(1);
    expect(chart.notes[0].sigId).toBe("sg-nap-4");
    expect(chart.notes[0].reason).toContain("gap");
  });

  it("chọn kèm một signal designed (sg9) cùng một signal sống (sg1): note có sg9, group chỉ có sg1", () => {
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg9", "sg1"], "nav");
    expect(chart.groups.map((g) => g.sigId)).toEqual(["sg1"]);
    expect(chart.notes.map((n) => n.sigId)).toEqual(["sg9"]);
    expect(chart.notes[0].reason).toContain("designed");
    // Không có cột total=0 nào được tạo cho sg9 — group của nó không tồn tại, không phải tồn tại rồi rỗng.
    expect(chart.groups.find((g) => g.sigId === "sg9")).toBeUndefined();
  });
});

describe("signalChart — rule 3 (cột): giá trị CHƯA KHAI phải hiện ra, không bị bỏ", () => {
  it("giá trị 'timeout' không có trong Signal.values vẫn xuất hiện thành cột declared:false", () => {
    const sig = makeSignal({ id: "sg-undeclared", vol: 5, values: ["success", "fail"] });
    const rows: SigCount[] = (["acq", "nav", "age", "tier", "sigpf"] as const).flatMap((dim) => [
      { sig: "sg-undeclared", dim, val: "success", band: "A", n: 2 },
      { sig: "sg-undeclared", dim, val: "success", band: "B", n: 1 },
      { sig: "sg-undeclared", dim, val: "fail", band: "A", n: 1 },
      { sig: "sg-undeclared", dim, val: "timeout", band: "A", n: 1 },
    ]);

    const chart = signalChart(rows, [sig], dims, ["sg-undeclared"], "nav");
    expect(chart.groups).toHaveLength(1);
    const [group] = chart.groups;
    expect(sumTotals(group.cols)).toBe(sig.vol);

    const success = group.cols.find((c) => c.val === "success");
    const fail = group.cols.find((c) => c.val === "fail");
    const timeout = group.cols.find((c) => c.val === "timeout");
    expect(success).toMatchObject({ declared: true, total: 3 });
    expect(fail).toMatchObject({ declared: true, total: 1 });
    expect(timeout).toMatchObject({ declared: false, total: 1 });
    // Declared trước, undeclared sau.
    expect(group.cols.map((c) => c.val)).toEqual(["success", "fail", "timeout"]);
  });
});

describe("signalChart — rule 7: dimStates tính từ dữ liệu, không hand-declare", () => {
  it("full / partial (missingPct đúng) / locked, label lấy từ `dims`", () => {
    const sig = makeSignal({ id: "sg-dimstates", vol: 10, values: ["x"] });
    const rows: SigCount[] = [
      { sig: "sg-dimstates", dim: "acq", val: "x", band: "X", n: 10 }, // full
      { sig: "sg-dimstates", dim: "nav", val: "x", band: "A", n: 6 }, // partial, missing 4/10
      // "age" — không có dòng nào → locked
      { sig: "sg-dimstates", dim: "tier", val: "x", band: "X", n: 10 }, // full
      { sig: "sg-dimstates", dim: "sigpf", val: "x", band: "ios", n: 10 }, // full
    ];

    const chart = signalChart(rows, [sig], dims, ["sg-dimstates"], "acq");
    const byId = new Map(chart.dimStates.map((d) => [d.id, d]));

    expect(byId.get("acq")).toMatchObject({ state: "full", label: dims.acq.label });
    expect(byId.get("tier")).toMatchObject({ state: "full", label: dims.tier.label });
    expect(byId.get("sigpf")).toMatchObject({ state: "full", label: dims.sigpf.label });
    expect(byId.get("age")).toMatchObject({ state: "locked", label: dims.age.label });
    const nav = byId.get("nav");
    expect(nav?.state).toBe("partial");
    expect((nav as { missingPct: number }).missingPct).toBeCloseTo(0.4, 10);

    // Nhãn KHÔNG phải là id thô.
    expect(byId.get("nav")?.label).not.toBe("nav");
    expect(byId.get("nav")?.label).toBe("Phân khúc NAV");
  });

  it("ném lỗi khi một chiều cố định thiếu entry trong `dims` — lỗi khai báo, không âm thầm dùng id thô", () => {
    const sig = makeSignal({ id: "sg-misdeclared", vol: 3, values: ["x"] });
    const rows: SigCount[] = [{ sig: "sg-misdeclared", dim: "acq", val: "x", band: "X", n: 3 }];
    const brokenDims = { ...dims };
    delete (brokenDims as Record<string, unknown>).nav;

    expect(() => signalChart(rows, [sig], brokenDims, ["sg-misdeclared"], "acq")).toThrow(/nav/);
  });
});

describe("signalChart — rule 6: notIdentified là thuộc tính của SIGNAL, không của chiều đang xem", () => {
  it("xem chiều sigpf (được miễn ràng buộc 3) vẫn báo đúng số 'chưa gắn được khách' của sg1, khác 0", () => {
    const chart = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg1"], "sigpf");
    const group = chart.groups.find((g) => g.sigId === "sg1")!;

    const expectedFromAcq = demoData.sigCounts
      .filter((r) => r.sig === "sg1" && r.dim === "acq" && r.band === NOT_IDENTIFIED)
      .reduce((a, r) => a + r.n, 0);

    expect(group.notIdentified).toBe(expectedFromAcq);
    expect(group.notIdentified).not.toBe(0);
    expect(group.notIdentifiedPct).toBeCloseTo(expectedFromAcq / group.vol, 10);
  });

  it("không có dòng chiều khách nào cho signal → notIdentified và notIdentifiedPct đều null, không phải 0", () => {
    const sig = makeSignal({ id: "sg-no-cust-dim", vol: 4, values: ["x"] });
    // Chỉ có dòng ở sigpf (chiều nền tảng) — không có dòng ở bất kỳ chiều khách nào.
    const rows: SigCount[] = [{ sig: "sg-no-cust-dim", dim: "sigpf", val: "x", band: "ios", n: 4 }];

    const chart = signalChart(rows, [sig], dims, ["sg-no-cust-dim"], "sigpf");
    const group = chart.groups[0];
    expect(group.notIdentified).toBeNull();
    expect(group.notIdentifiedPct).toBeNull();
  });
});

describe("signalChart — rule 4: rank giảm dần theo n, tie-break tất định theo band", () => {
  it("sắp theo n giảm dần; hai band cùng n tie-break theo band tăng dần, không theo thứ tự dòng vào", () => {
    const sig = makeSignal({ id: "sg-rank", vol: 25, values: ["x"] });
    // Cố ý đưa "Z" vào TRƯỚC "B" để chứng minh tie-break không phụ thuộc thứ tự dòng vào.
    const rows: SigCount[] = [
      { sig: "sg-rank", dim: "acq", val: "x", band: "Z", n: 10 },
      { sig: "sg-rank", dim: "acq", val: "x", band: "B", n: 10 },
      { sig: "sg-rank", dim: "acq", val: "x", band: "A", n: 5 },
    ];

    const chart = signalChart(rows, [sig], dims, ["sg-rank"], "acq");
    const slices = chart.groups[0].cols[0].slices;
    expect(slices.map((s) => [s.band, s.n, s.rank])).toEqual([
      ["B", 10, 0],
      ["Z", 10, 1],
      ["A", 5, 2],
    ]);
  });
});

describe("signalChart — pure: không mutate input, cùng input ra cùng output", () => {
  it("gọi hai lần với cùng input ra kết quả deep-equal; rows/signal đầu vào không đổi", () => {
    const rowsBefore = structuredClone(demoData.sigCounts);
    const sig1Before = structuredClone(demoData.signals[0]);

    const chart1 = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg1", "sg3"], "nav");
    const chart2 = signalChart(demoData.sigCounts, demoData.signals, dims, ["sg1", "sg3"], "nav");

    expect(chart1).toEqual(chart2);
    expect(demoData.sigCounts).toEqual(rowsBefore);
    expect(demoData.signals[0]).toEqual(sig1Before);
  });
});

/* Ba nghĩa "không biết" phải tách hẳn nhau NGAY TỪ ĐÂY. Nếu tầng này trả về một cờ boolean thì tầng
   vẽ chỉ còn một cách tô cho cả ba, tức gộp ba nghĩa bằng màu — index.css dòng 33-37 đã ghi rõ đó là
   sai và đã dựng thang màu riêng vì lý do đó. */
describe("signalChart — ba nghĩa 'không biết' tách riêng, dải có tên thật thì để nguyên", () => {
  const live = demoData.signals.filter((s) => s.vol > 0).map((s) => s.id);
  const seen = new Map<string, Set<string>>();
  for (const dimId of [...SIG_CUST_DIMS, SIG_FIRE_DIM]) {
    for (const g of signalChart(demoData.sigCounts, demoData.signals, dims, live, dimId).groups) {
      for (const c of g.cols) {
        for (const s of c.slices) {
          const kinds = seen.get(s.band) ?? new Set<string>();
          kinds.add(String(s.unknown));
          seen.set(s.band, kinds);
        }
      }
    }
  }

  it("một dải luôn ra CÙNG một nghĩa, ở mọi chiều và mọi điểm đo", () => {
    for (const [band, kinds] of seen) {
      expect([...kinds], `dải "${band}" ra nhiều nghĩa khác nhau`).toHaveLength(1);
    }
  });

  it("`chưa định danh` là 'not-identified', không lẫn với hai loại thiếu dữ kiện của khách", () => {
    expect(seen.get(NOT_IDENTIFIED)).toEqual(new Set(["not-identified"]));
    expect(seen.get(UNKNOWN_YET)).toEqual(new Set(["unknown-yet"]));
  });

  it("dải có tên thật để nguyên `null` — không bị quét vào rổ 'không biết'", () => {
    // Nền tảng và phân khúc NAV là dải có tên thật; `android` là chữ thô, làm đẹp ở tầng hiển thị.
    expect(seen.get("android")).toEqual(new Set(["null"]));
    expect(seen.get("<50tr")).toEqual(new Set(["null"]));
  });

  /* ĐÃ ĐO (05/08): cả BA nghĩa cùng có mặt trong dữ liệu demo. Nên đây không phải ca lý thuyết —
     tô cả ba cùng một màu xám thì màn hình đầu tiên owner mở đã hiện ba lát không phân biệt được.
     Test này đứng đây để nếu ai rút bớt phủ của fixture, người sửa biết mình vừa làm mất một ca
     kiểm THẬT chứ không phải một ca dựng tay. */
  it("chống rỗng: fixture thật có cả BA nghĩa 'không biết' cùng tồn tại", () => {
    const kinds = new Set([...seen.values()].flatMap((s) => [...s]).filter((k) => k !== "null"));
    expect([...kinds].sort()).toEqual(["missing", "not-identified", "unknown-yet"]);
  });
});
