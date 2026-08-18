import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { demoData, recountDemoSignals } from "../../data/fixtures/demo.ts";
import { createCxmStore } from "../../store/store.ts";
import { isSignalRunning } from "../../domain/index.ts";
import {
  EMPTY_SIGNAL_FILTER,
  PHASE_BROKEN,
  SIGNAL_FACET_MATCH,
  SRC_UNLINKED,
  groupSignalsByPhase,
  isFilterActive,
  matchedSignalIds,
  orderedSignals,
  signalPhaseId,
  type SignalFilter,
} from "./facets.ts";
import { SignalsPage } from "./SignalsPage.tsx";

/* Bộ lọc màn Điểm đo. Điều phải canh KHÔNG phải các con số cụ thể mà là bốn luật:
   1. F1 — bảng LUÔN đủ `data.signals.length` dòng, ở MỌI trạng thái lọc. Lọc ở đây tô, không cắt.
   2. Số trên chip khối ① (đếm bằng hàm domain) phải bằng số dòng được tô (đếm bằng vị từ ở
      `facets.ts`) — hai đường đếm khác nhau nên chúng CÓ THỂ lệch, đây là chỗ canh.
   3. Số ở tiêu đề mỗi nhóm phase phải bằng số dòng được tô TRONG CHÍNH nhóm đó.
   4. Mọi điều kiện GIAO nhau, không cộng dồn. */

function demoStore() {
  return createCxmStore(new MockRepository(demoData, recountDemoSignals));
}

const filterWith = (patch: Partial<SignalFilter>): SignalFilter => ({ ...EMPTY_SIGNAL_FILTER, ...patch });

/** Đọc "N / M" ở đầu một dòng khối ① — cùng cách đọc của test F6, không ghim số. */
function ratioOf(text: string | null): [number, number] {
  const m = text?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) throw new Error(`không đọc được N/M từ: ${text}`);
  return [Number(m[1]), Number(m[2])];
}

/** Số ĐẦU TIÊN trong một chuỗi — chip 18/08 chỉ mang TỬ SỐ, mẫu số nằm ở "N signals" (inv-total). */
function firstIntOf(text: string | null): number {
  const m = text?.match(/\d+/);
  if (!m) throw new Error(`không đọc được số từ: ${text}`);
  return Number(m[0]);
}

/** Dòng đang được tô = dòng KHÔNG mang class làm mờ. Đọc từ DOM thật, không đoán theo state. */
function litRowIds(): string[] {
  return screen
    .getAllByTestId(/^signal-row-/)
    .filter((tr) => !tr.className.includes("opacity-50"))
    .map((tr) => (tr.getAttribute("data-testid") ?? "").replace("signal-row-", ""));
}

/* `queryAll` chứ không `getAll`: thu gọn hết nhóm là một trạng thái HỢP LỆ có 0 dòng, mà `getAll`
   thì ném lỗi ở 0 phần tử — dùng nó ở đây là biến một trạng thái cần đo thành một lỗi hạ tầng. */
function allRowIds(): string[] {
  return screen
    .queryAllByTestId(/^signal-row-/)
    .map((tr) => (tr.getAttribute("data-testid") ?? "").replace("signal-row-", ""));
}

describe("facets.ts — vị từ, phân hoạch, thứ tự", () => {
  it("ba vị từ chia đúng tập: running ∪ not-running = tất cả, và không giao nhau", () => {
    const running = demoData.signals.filter(SIGNAL_FACET_MATCH.running);
    const notRunning = demoData.signals.filter(SIGNAL_FACET_MATCH["not-running"]);
    expect(running.length + notRunning.length).toBe(demoData.signals.length);
    expect(running.filter((s) => notRunning.includes(s))).toEqual([]);
    expect(running.every(isSignalRunning)).toBe(true);
  });

  it("bộ lọc rỗng ⇒ null (không tô); ô tìm chỉ có khoảng trắng cũng là rỗng", () => {
    expect(isFilterActive(EMPTY_SIGNAL_FILTER)).toBe(false);
    expect(matchedSignalIds(demoData, EMPTY_SIGNAL_FILTER)).toBeNull();
    expect(matchedSignalIds(demoData, filterWith({ query: "   " }))).toBeNull();
  });

  it("gom nhóm là PHÂN HOẠCH: tổng dòng mọi nhóm luôn bằng data.signals.length (F1)", () => {
    for (const f of [
      EMPTY_SIGNAL_FILTER,
      filterWith({ facet: "no-metric" }),
      filterWith({ query: "chuỗi-không-tồn-tại-zzz" }),
      filterWith({ srcId: SRC_UNLINKED }),
    ]) {
      const groups = groupSignalsByPhase(demoData, matchedSignalIds(demoData, f));
      const total = groups.reduce((n, g) => n + g.signals.length, 0);
      expect(total).toBe(demoData.signals.length);
      expect(orderedSignals(groups).length).toBe(demoData.signals.length);
    }
  });

  it("nhóm xếp theo THỨ TỰ PHASE của dữ liệu, nhóm chuỗi đứt (nếu có) đứng cuối", () => {
    const groups = groupSignalsByPhase(demoData, null);
    const real = groups.filter((g) => g.phaseId !== PHASE_BROKEN).map((g) => g.phaseId);
    const expected = demoData.phases.map((p) => p.id).filter((id) => real.includes(id));
    expect(real).toEqual(expected);
    const brokenAt = groups.findIndex((g) => g.phaseId === PHASE_BROKEN);
    if (brokenAt >= 0) expect(brokenAt).toBe(groups.length - 1);
  });

  it("mỗi điểm đo nằm ĐÚNG một nhóm, và nhóm đó khớp signalPhaseId", () => {
    const groups = groupSignalsByPhase(demoData, null);
    for (const g of groups) {
      for (const sig of g.signals) expect(signalPhaseId(demoData, sig)).toBe(g.phaseId);
    }
    expect(new Set(orderedSignals(groups).map((s) => s.id)).size).toBe(demoData.signals.length);
  });

  it("`matched` của nhóm đếm đúng phần khớp NẰM TRONG nhóm đó, không phải toàn bảng", () => {
    const f = filterWith({ facet: "no-metric" });
    const matched = matchedSignalIds(demoData, f)!;
    const groups = groupSignalsByPhase(demoData, matched);
    for (const g of groups) {
      expect(g.matched).toBe(g.signals.filter((s) => matched.has(s.id)).length);
    }
    expect(groups.reduce((n, g) => n + (g.matched ?? 0), 0)).toBe(matched.size);
  });

  it("không lọc ⇒ tiêu đề nhóm KHÔNG khai số khớp (matched null)", () => {
    for (const g of groupSignalsByPhase(demoData, null)) expect(g.matched).toBeNull();
  });

  it("ô tìm soi tên event, nhãn, TÊN chỉ số, TÊN bước và TÊN phase", () => {
    const sig = demoData.signals.find((s) => s.metrics.length > 0)!;
    const metricName = demoData.metrics.find((m) => m.id === sig.metrics[0])!.name;
    expect(matchedSignalIds(demoData, filterWith({ query: sig.name }))!.has(sig.id)).toBe(true);
    expect(matchedSignalIds(demoData, filterWith({ query: sig.desc }))!.has(sig.id)).toBe(true);
    expect(matchedSignalIds(demoData, filterWith({ query: metricName }))!.has(sig.id)).toBe(true);

    const phase = demoData.phases.find((p) => signalPhaseId(demoData, sig) === p.id)!;
    const byPhaseName = matchedSignalIds(demoData, filterWith({ query: phase.name }))!;
    expect(byPhaseName.has(sig.id)).toBe(true);
  });
});

describe("Lọc theo trường — mỗi ô lọc đúng tập của chính nó", () => {
  it("lọc theo phase ⇒ đúng những điểm đo thuộc phase đó, không dòng nào biến mất", () => {
    const groups = groupSignalsByPhase(demoData, null);
    const target = groups.find((g) => g.phaseId !== PHASE_BROKEN && g.signals.length > 0)!;
    const matched = matchedSignalIds(demoData, filterWith({ phaseId: target.phaseId }))!;
    expect(new Set(matched)).toEqual(new Set(target.signals.map((s) => s.id)));
  });

  it("lọc theo trạng thái tin dùng ⇒ đúng những điểm đo mang chính st đó", () => {
    const st = demoData.signals[0].st;
    const matched = matchedSignalIds(demoData, filterWith({ st }))!;
    expect(new Set(matched)).toEqual(new Set(demoData.signals.filter((s) => s.st === st).map((s) => s.id)));
  });

  it("lọc theo chỉ số ⇒ đúng những điểm đo nuôi chỉ số đó", () => {
    const sig = demoData.signals.find((s) => s.metrics.length > 0)!;
    const metricId = sig.metrics[0];
    const matched = matchedSignalIds(demoData, filterWith({ metricId }))!;
    expect(new Set(matched)).toEqual(
      new Set(demoData.signals.filter((s) => s.metrics.includes(metricId)).map((s) => s.id)),
    );
  });

  it("lọc 'chưa nối nguồn' KHÁC hẳn lọc theo một nguồn cụ thể — không gộp hai nghĩa", () => {
    const unlinked = matchedSignalIds(demoData, filterWith({ srcId: SRC_UNLINKED }))!;
    expect(new Set(unlinked)).toEqual(new Set(demoData.signals.filter((s) => s.srcId === null).map((s) => s.id)));

    const someSrc = demoData.signals.find((s) => s.srcId !== null)?.srcId;
    if (someSrc) {
      const bySrc = matchedSignalIds(demoData, filterWith({ srcId: someSrc }))!;
      expect(new Set(bySrc)).toEqual(new Set(demoData.signals.filter((s) => s.srcId === someSrc).map((s) => s.id)));
      expect([...bySrc].some((id) => unlinked.has(id))).toBe(false);
    }
  });

  it("hai trường cùng đặt ⇒ GIAO, không phải hợp", () => {
    const sig = demoData.signals.find((s) => s.metrics.length > 0)!;
    const both = matchedSignalIds(demoData, filterWith({ metricId: sig.metrics[0], st: sig.st }))!;
    for (const id of both) {
      const s = demoData.signals.find((x) => x.id === id)!;
      expect(s.metrics.includes(sig.metrics[0]) && s.st === sig.st).toBe(true);
    }
    const onlyMetric = matchedSignalIds(demoData, filterWith({ metricId: sig.metrics[0] }))!;
    expect(both.size).toBeLessThanOrEqual(onlyMetric.size);
  });
});

describe("Khối ① bấm được — số trên chip bằng số dòng được tô", () => {
  const CASES = [
    { testId: "inv-running", facet: "running" as const },
    { testId: "inv-not-running", facet: "not-running" as const },
    { testId: "inv-signal-no-metric", facet: "no-metric" as const },
  ];

  for (const c of CASES) {
    it(`${c.testId}: bấm ⇒ tô đúng N dòng của chính nó, tổng dòng KHÔNG đổi (F1)`, () => {
      const store = demoStore();
      render(<SignalsPage useStore={store} />);
      const { data } = store.getState();

      const chip = screen.getByTestId(c.testId);
      // 18/08: chip chỉ mang TỬ SỐ; mẫu số của cả dòng đứng ở "N signals" ngay bên trái.
      const n = firstIntOf(chip.textContent);
      expect(firstIntOf(screen.getByTestId("inv-total").textContent)).toBe(data.signals.length);
      expect(n).toBeGreaterThan(0); // tiền đề: chip này có dữ liệu để tô

      fireEvent.click(chip);

      expect(chip).toHaveAttribute("aria-pressed", "true");
      expect(allRowIds().length).toBe(data.signals.length);
      const lit = litRowIds();
      expect(lit.length).toBe(n);
      // Đúng TẬP nào, không chỉ đúng số lượng.
      expect(new Set(lit)).toEqual(new Set(data.signals.filter(SIGNAL_FACET_MATCH[c.facet]).map((s) => s.id)));
    });
  }

  it("bấm lại chính chip đang bật ⇒ tắt lọc, không dòng nào bị mờ", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const chip = screen.getByTestId("inv-running");

    fireEvent.click(chip);
    expect(screen.getByTestId("signal-table-count")).toBeInTheDocument();

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByTestId("signal-table-count")).not.toBeInTheDocument();
    expect(litRowIds().length).toBe(store.getState().data.signals.length);
  });

  it("chỉ MỘT chip bật một lúc — bấm chip khác thì chip cũ tắt", () => {
    render(<SignalsPage useStore={demoStore()} />);
    fireEvent.click(screen.getByTestId("inv-running"));
    fireEvent.click(screen.getByTestId("inv-not-running"));
    expect(screen.getByTestId("inv-running")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("inv-not-running")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Bảng chia nhóm theo phase — lọc làm mờ TẠI CHỖ, không đổi thứ tự", () => {
  it("thứ tự dòng KHÔNG đổi khi bật/tắt lọc — nhóm phase đứng yên", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const before = allRowIds();

    fireEvent.click(screen.getByTestId("inv-not-running"));
    expect(allRowIds()).toEqual(before);

    fireEvent.change(screen.getByTestId("signal-table-search"), { target: { value: "ekyc" } });
    expect(allRowIds()).toEqual(before);
  });

  it("tiêu đề mỗi nhóm khai đúng 'khớp / tổng' của CHÍNH nhóm đó", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();

    fireEvent.click(screen.getByTestId("inv-signal-no-metric"));

    const matched = matchedSignalIds(data, filterWith({ facet: "no-metric" }))!;
    for (const g of groupSignalsByPhase(data, matched)) {
      const el = screen.getByTestId(`signal-group-count-${g.phaseId.trim()}`);
      const [n, of] = ratioOf(el.textContent);
      expect(of).toBe(g.signals.length);
      expect(n).toBe(g.matched);
    }
  });

  it("tiêu đề nhóm KHÔNG mang testid dòng — mẫu số F1 chỉ đếm điểm đo thật", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    expect(allRowIds().length).toBe(store.getState().data.signals.length);
  });

  it("lọc theo một phase ⇒ nhóm khác mờ hết nhưng vẫn còn nguyên dòng trên màn", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const groups = groupSignalsByPhase(data, null);
    const target = groups.find((g) => g.phaseId !== PHASE_BROKEN && g.signals.length > 0)!;

    fireEvent.change(screen.getByTestId("signal-filter-phase"), { target: { value: target.phaseId } });

    expect(allRowIds().length).toBe(data.signals.length);
    expect(new Set(litRowIds())).toEqual(new Set(target.signals.map((s) => s.id)));
  });
});

describe("Ô tìm — tô, không cắt dòng", () => {
  it("gõ tên một điểm đo ⇒ đúng nó được tô, mọi dòng khác vẫn còn và vẫn đứng yên", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals[data.signals.length - 1];

    fireEvent.change(screen.getByTestId("signal-table-search"), { target: { value: target.name } });

    expect(allRowIds().length).toBe(data.signals.length);
    expect(litRowIds()).toContain(target.id);
  });

  it("chuỗi không khớp gì ⇒ 0 dòng được tô, bảng vẫn đủ dòng (không có màn rỗng)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    fireEvent.change(screen.getByTestId("signal-table-search"), {
      target: { value: "chuỗi-không-tồn-tại-zzz" },
    });
    expect(litRowIds().length).toBe(0);
    expect(allRowIds().length).toBe(store.getState().data.signals.length);
  });

  it("nút xoá ô tìm trả bảng về trạng thái không tô", () => {
    render(<SignalsPage useStore={demoStore()} />);
    const box = screen.getByTestId("signal-table-search");
    fireEvent.change(box, { target: { value: "ekyc" } });
    fireEvent.click(screen.getByTestId("signal-table-search-clear"));
    expect((box as HTMLInputElement).value).toBe("");
    expect(screen.queryByTestId("signal-table-count")).not.toBeInTheDocument();
  });

  it("chip và ô tìm giao nhau (AND), không cộng dồn", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals.find((s) => !isSignalRunning(s))!;

    fireEvent.click(screen.getByTestId("inv-running"));
    fireEvent.change(screen.getByTestId("signal-table-search"), { target: { value: target.name } });

    expect(litRowIds()).not.toContain(target.id);
  });
});

/* Thu gọn nhóm (owner chốt 12/08 tối). Thu gọn ĐÚNG LÀ ẩn dòng, nên điều phải canh không còn là
   "số dòng luôn bằng tổng" mà là điều kiện khiến nó vẫn hợp F1: MẪU SỐ KHÔNG RỜI KHỎI MÀN. Bốn luật:
   1. mặc định mở hết — mở màn ra không giấu sẵn gì;
   2. nhóm thu gọn vẫn khai đủ số của mình, và tổng số ở mọi tiêu đề = data.signals.length;
   3. thu gọn KHÔNG đổi một con số đếm nào;
   4. thu gọn là việc của mắt: hồ sơ vẫn đi hết mọi điểm đo. */
describe("Thu gọn nhóm — ẩn thân, giữ mẫu số", () => {
  /** Số "tổng" mà một tiêu đề nhóm đang khai: "N signals" hoặc "K / N match". */
  function headerTotal(phaseId: string): number {
    const text = screen.getByTestId(`signal-group-toggle-${phaseId.trim()}`).textContent ?? "";
    const ratio = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (ratio) return Number(ratio[2]);
    const plain = text.match(/(\d+)\s*signals/);
    if (!plain) throw new Error(`tiêu đề nhóm không khai số nào: ${text}`);
    return Number(plain[1]);
  }

  it("mặc định MỞ HẾT — không nhóm nào mở màn ra đã bị giấu", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    for (const g of groupSignalsByPhase(data, null)) {
      expect(screen.getByTestId(`signal-group-toggle-${g.phaseId.trim()}`)).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    }
    expect(allRowIds().length).toBe(data.signals.length);
  });

  it("thu gọn một nhóm ⇒ đúng dòng của nhóm đó rời màn, nhóm khác còn nguyên", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const groups = groupSignalsByPhase(data, null);
    const target = groups.find((g) => g.signals.length > 0)!;

    fireEvent.click(screen.getByTestId(`signal-group-toggle-${target.phaseId.trim()}`));

    const shown = new Set(allRowIds());
    for (const s of target.signals) expect(shown.has(s.id)).toBe(false);
    for (const g of groups) {
      if (g.phaseId === target.phaseId) continue;
      for (const s of g.signals) expect(shown.has(s.id)).toBe(true);
    }
    expect(shown.size).toBe(data.signals.length - target.signals.length);
  });

  it("nhóm thu gọn VẪN khai đủ số của nó — mẫu số không rời khỏi màn (điều kiện của F1)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const groups = groupSignalsByPhase(data, null);

    fireEvent.click(screen.getByTestId("signal-groups-toggle-all"));

    expect(allRowIds().length).toBe(0);
    let sum = 0;
    for (const g of groups) {
      expect(screen.getByTestId(`signal-group-toggle-${g.phaseId.trim()}`)).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      sum += headerTotal(g.phaseId);
    }
    expect(sum).toBe(data.signals.length);
  });

  it("thu gọn KHÔNG đổi một con số đếm nào — lọc và thu gọn là hai việc rời nhau", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();

    fireEvent.click(screen.getByTestId("inv-signal-no-metric"));
    const countBefore = screen.getByTestId("signal-table-count").textContent;
    const groupsBefore = groupSignalsByPhase(data, matchedSignalIds(data, filterWith({ facet: "no-metric" }))!)
      .map((g) => [g.phaseId, screen.getByTestId(`signal-group-count-${g.phaseId.trim()}`).textContent] as const);

    fireEvent.click(screen.getByTestId("signal-groups-toggle-all"));

    expect(screen.getByTestId("signal-table-count").textContent).toBe(countBefore);
    for (const [phaseId, text] of groupsBefore) {
      expect(screen.getByTestId(`signal-group-count-${phaseId.trim()}`).textContent).toBe(text);
    }
  });

  it("mở lại mọi nhóm ⇒ bảng đủ đúng data.signals.length dòng như cũ (F1)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const before = allRowIds();

    fireEvent.click(screen.getByTestId("signal-groups-toggle-all"));
    fireEvent.click(screen.getByTestId("signal-groups-toggle-all"));

    expect(allRowIds()).toEqual(before);
    expect(allRowIds().length).toBe(data.signals.length);
  });

  it("hồ sơ vẫn đi hết MỌI điểm đo dù nhóm đang thu gọn — thu gọn là việc của mắt", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const groups = groupSignalsByPhase(data, null);
    const target = groups.find((g) => g.signals.length > 0)!;
    const other = groups.find((g) => g.phaseId !== target.phaseId && g.signals.length > 0)!;

    fireEvent.click(screen.getByTestId(`signal-group-toggle-${target.phaseId.trim()}`));
    fireEvent.click(screen.getByTestId(`signal-row-${other.signals[0].id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));

    expect(screen.getByTestId("signal-profile-nav").textContent).toContain(`/ ${data.signals.length}`);
  });

  it("vào hồ sơ rồi quay ra ⇒ nhóm nào đang thu gọn vẫn thu gọn", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const groups = groupSignalsByPhase(data, null);
    const target = groups.find((g) => g.signals.length > 0)!;
    const other = groups.find((g) => g.phaseId !== target.phaseId && g.signals.length > 0)!;

    fireEvent.click(screen.getByTestId(`signal-group-toggle-${target.phaseId.trim()}`));
    fireEvent.click(screen.getByTestId(`signal-row-${other.signals[0].id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    fireEvent.click(screen.getByTestId("signal-profile-back"));

    expect(screen.getByTestId(`signal-group-toggle-${target.phaseId.trim()}`)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(allRowIds().length).toBe(data.signals.length - target.signals.length);
  });
});

describe("Hồ sơ — đi tới/lui theo đúng thứ tự đang thấy trên bảng", () => {
  it("mở dòng đầu của bảng ⇒ nút lui bị khoá, nút tới mở đúng dòng thứ hai ĐANG THẤY", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const shown = orderedSignals(groupSignalsByPhase(data, null));

    fireEvent.click(screen.getByTestId(`signal-row-${shown[0].id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    expect(screen.getByTestId("signal-profile-prev")).toBeDisabled();
    expect(screen.getByTestId("signal-profile-nav").textContent).toContain(`1 / ${data.signals.length}`);

    fireEvent.click(screen.getByTestId("signal-profile-next"));
    expect(screen.getByTestId("signal-profile-title").textContent).toBe(shown[1].desc);
  });

  it("'tới' chạy theo thứ tự BẢNG ĐÃ CHIA NHÓM, không theo thứ tự data.signals", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const shown = orderedSignals(groupSignalsByPhase(data, null));

    fireEvent.click(screen.getByTestId(`signal-row-${shown[0].id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    fireEvent.click(screen.getByTestId("signal-profile-next"));

    expect(screen.getByTestId("signal-profile-title").textContent).toBe(shown[1].desc);
  });

  it("đóng hồ sơ ⇒ dòng vừa xem được tô lại trên bảng (aria-current)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals[2];

    fireEvent.click(screen.getByTestId(`signal-row-${target.id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    fireEvent.click(screen.getByTestId("signal-profile-back"));

    expect(screen.getByTestId(`signal-row-${target.id}`)).toHaveAttribute("aria-current", "true");
  });

  it("bàn phím: Enter trên một dòng mở drawer đúng dòng đó", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals[1];

    fireEvent.keyDown(screen.getByTestId(`signal-row-${target.id}`), { key: "Enter" });
    expect(screen.getByTestId("signal-drawer")).toHaveAttribute("aria-label", target.name);
  });
});
