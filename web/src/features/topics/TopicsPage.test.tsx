import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { demoData } from "../../data/fixtures/demo.ts";
import {
  defaultTopicLines,
  driftNodes,
  fallingThemes,
  freshThemes,
  risingThemes,
  themesByVolume,
} from "../../domain/index.ts";
import { effectiveMonths, maxRealMonths } from "../overview/sec.ts";
import { useTimeframeStore } from "../../store/timeframe.ts";
import { TopicsPage } from "./TopicsPage.tsx";

/* Màn đọc store singleton thật, mà singleton là `demoData` (store/store.ts:176) — KHÔNG phải seed.
   Mọi kỳ vọng ở đây SUY từ `demoData` qua chính các hàm domain, không chép số bằng tay.

   Chỗ canh kỹ nhất: chart phải vẽ trên chuỗi THẬT. Prototype vẽ trên chuỗi 12 điểm mà 6 điểm đầu
   là ngoại suy (`monthly()`), dán nhãn tháng thật lên. Nhóm test áp chót ghim rằng bản này không
   làm thế, và ghim luôn hai hệ quả: không có nhãn tháng bịa, và số kỳ đọc từ bộ lọc thật. */

const months0 = () => effectiveMonths(useTimeframeStore.getState().range, maxRealMonths(demoData));

/* Trên màn có HAI nhãn trục: một của chart đường, một của bảng topic ("Volume · xu hướng theo kỳ").
   Nhãn cần soi là nhãn của chart, nên tra trong đúng khối `topic-chart`. */
const chartAxis = (container: HTMLElement) =>
  within(container.querySelector('[data-tour="topic-chart"]') as HTMLElement).getByTestId("axis-label");

function renderPage() {
  return render(
    <MemoryRouter>
      <TopicsPage />
    </MemoryRouter>,
  );
}

// Thanh thời gian là store GLOBAL — một test đổi range thì test sau phải thấy lại mặc định.
const range0 = useTimeframeStore.getState().range;
afterEach(() => useTimeframeStore.getState().setRange(range0));

describe("TopicsPage — câu tiêu đề đọc từ dữ liệu", () => {
  it("đếm đúng số topic đang mở và số topic đang tăng theo hướng xấu", () => {
    renderPage();
    const m = months0();
    expect(screen.getByTestId("topics-hero")).toHaveTextContent(
      `${themesByVolume(demoData).length} topic đang mở, ${risingThemes(demoData, m).length} đang tăng theo hướng xấu.`,
    );
  });

  /* Nếu hai con số này bằng nhau thì test trên vẫn xanh mà chẳng chứng minh gì — chốt rằng chúng
     thật sự khác nhau trong bộ đang render. */
  it("số topic đang tăng KHÁC tổng số topic", () => {
    expect(risingThemes(demoData, months0()).length).not.toBe(themesByVolume(demoData).length);
  });
});

describe("TopicsPage — dải mẫu số của chart nói rõ phần KHÔNG vẽ", () => {
  it("in số đường đang vẽ trên tổng số topic, kèm ba nhóm chuyển động", () => {
    renderPage();
    const m = months0();
    const denom = screen.getByTestId("topics-chart-denom");
    expect(denom).toHaveTextContent(
      `Đang vẽ ${defaultTopicLines(demoData, m).length} trên ${themesByVolume(demoData).length} topic`,
    );
    expect(denom).toHaveTextContent(`${risingThemes(demoData, m).length} nổi lên`);
    expect(denom).toHaveTextContent(`${fallingThemes(demoData, m).length} lắng xuống`);
    expect(denom).toHaveTextContent(`${freshThemes(demoData, m).length} mới xuất hiện`);
  });

  /* Luật cắt: taxonomy nở bao nhiêu thì chart vẫn mở tối đa sáu đường. Chốt rằng mẫu số ĐANG nói
     về một tập con thật sự, không phải "6 trên 6". */
  it("số đường đang vẽ nhỏ hơn hẳn tổng số topic", () => {
    const m = months0();
    expect(defaultTopicLines(demoData, m).length).toBeLessThan(themesByVolume(demoData).length);
  });

  /* Chart và bảng đều in một dải "N trên 14 topic", nằm sát nhau, cùng mẫu số — hai con số đúng
     nhưng đặt cạnh nhau thì mời người đọc so nhầm. Ghim rằng (a) chúng THẬT SỰ khác nhau trong bộ
     đang render, nếu không câu nối chẳng để làm gì, và (b) có câu nói rõ mỗi bên đếm gì. */
  it("hai dải mẫu số cạnh nhau khác số, và màn nói rõ mỗi bên đếm gì", () => {
    const { container } = renderPage();
    const chart = screen.getByTestId("topics-chart-denom").textContent!;
    const table = within(container.querySelector('[data-tour="topic-table"]') as HTMLElement)
      .getByTestId("denom-strip").textContent!;
    const n = (s: string) => Number(s.match(/(\d+)\s+trên/)![1]);
    expect(n(chart)).not.toBe(n(table));
    const bridge = screen.getByTestId("topics-chart-bridge");
    expect(bridge).toHaveTextContent("đường đang mở trên biểu đồ");
    expect(bridge).toHaveTextContent("dòng bảng đang liệt kê");
    expect(bridge).toHaveTextContent(`${themesByVolume(demoData).length} topic`);
  });
});

describe("TopicsPage — chọn đường vẽ", () => {
  it("mở sẵn đúng bộ đường mặc định, mỗi đường một chip legend", () => {
    renderPage();
    for (const id of defaultTopicLines(demoData, months0())) {
      expect(screen.getByTestId(`topic-line-chip-${id}`)).toBeInTheDocument();
    }
  });

  it("bấm ✕ trên chip legend thì bỏ đúng đường đó, mẫu số giảm theo", () => {
    renderPage();
    const m = months0();
    const before = defaultTopicLines(demoData, m).length;
    const first = defaultTopicLines(demoData, m)[0]!;
    fireEvent.click(screen.getByTestId(`topic-line-chip-${first}`));
    expect(screen.queryByTestId(`topic-line-chip-${first}`)).not.toBeInTheDocument();
    expect(screen.getByTestId("topics-chart-denom")).toHaveTextContent(
      `Đang vẽ ${before - 1} trên ${themesByVolume(demoData).length} topic`,
    );
  });

  it("bấm ★ ở bảng thì thêm đường vào chart — bảng và chart dùng CHUNG một lựa chọn", () => {
    renderPage();
    const m = months0();
    const off = themesByVolume(demoData).find((t) => !defaultTopicLines(demoData, m).includes(t.id))!;
    expect(screen.queryByTestId(`topic-line-chip-${off.id}`)).not.toBeInTheDocument();
    const star = within(screen.getByTestId(`topic-row-${off.id}`)).getByRole("button");
    fireEvent.click(star);
    expect(screen.getByTestId(`topic-line-chip-${off.id}`)).toBeInTheDocument();
  });

  it("bỏ hết đường thì chart nói ra và chỉ đường làm lại, không hiện khung trống", () => {
    renderPage();
    for (const id of defaultTopicLines(demoData, months0())) {
      fireEvent.click(screen.getByTestId(`topic-line-chip-${id}`));
    }
    expect(screen.queryByTestId("topic-lines")).not.toBeInTheDocument();
    expect(screen.getByTestId("topic-lines-empty")).toHaveTextContent(/ở bảng bên dưới/);
  });
});

describe("TopicsPage — node cần người quyết", () => {
  it("nêu đủ số node chờ quyết, mỗi node một nút", () => {
    renderPage();
    const drifts = driftNodes(demoData);
    expect(drifts.length).toBeGreaterThan(0);
    expect(screen.getByTestId("topics-drift")).toHaveTextContent(
      `${drifts.length} node cần người quyết định`,
    );
    for (const n of drifts) expect(screen.getByTestId(`topics-drift-${n.id}`)).toBeInTheDocument();
  });

  /* Node chờ quyết KHÔNG chỉ nằm ở tầng theme — demoData có cả một node L3 và một sub-theme. Màn
     chi tiết nhận cả ba, nhưng tầng trên theme thì nó chỉ nói "chưa có màn riêng cho tầng này", nên
     chip phải ghi tầng để người bấm biết trước sẽ mở ra dạng nào. */
  it("node ngoài tầng theme thì chip ghi rõ tầng của nó", () => {
    renderPage();
    const outside = driftNodes(demoData).filter((n) => n.lv !== "theme");
    expect(outside.length).toBeGreaterThan(0);
    for (const n of outside) {
      expect(screen.getByTestId(`topics-drift-${n.id}`)).toHaveTextContent(`tầng ${n.lv}`);
    }
    for (const n of driftNodes(demoData).filter((n) => n.lv === "theme")) {
      expect(screen.getByTestId(`topics-drift-${n.id}`)).not.toHaveTextContent("tầng");
    }
  });

  it("nói thẳng là hệ thống chỉ phát hiện, người mới quyết", () => {
    renderPage();
    expect(screen.getByTestId("topics-drift")).toHaveTextContent(
      "Hệ thống phát hiện, con người quyết định",
    );
  });
});

describe("TopicsPage — KHÔNG bịa dữ liệu thời gian", () => {
  /* Prototype dán mảng nhãn tháng cứng ('08/25' … '07/26') lên trục ngang, trong khi nửa chuỗi là
     ngoại suy. Bản này không có nhãn tháng nào cả — trục chỉ nói hướng thời gian. */
  it("trục ngang không viết tên tháng nào", () => {
    const { container } = renderPage();
    const svg = container.querySelector('[data-testid="topic-lines"] svg')!;
    expect(svg.textContent).not.toMatch(/\d{2}\/\d{2}/);
    expect(svg.textContent).toContain("kỳ gần nhất");
  });

  it("số kỳ trên nhãn trục là số kỳ THẬT đang xem, không ghi cứng '6 kỳ'", () => {
    const { container } = renderPage();
    expect(chartAxis(container)).toHaveTextContent(`${months0()} kỳ gần nhất`);
  });

  /* Đổi bộ lọc thời gian chung: nhãn trục phải đi theo, và các đường người dùng đã chọn phải Ở LẠI
     (đổi cửa sổ thời gian không phải là lý do ném đi lựa chọn của họ). */
  it("đổi bộ lọc thời gian thì nhãn trục đổi theo, lựa chọn đường giữ nguyên", () => {
    const { container } = renderPage();
    const chosen = defaultTopicLines(demoData, months0());
    act(() => useTimeframeStore.getState().setRange("3m"));
    expect(chartAxis(container)).toHaveTextContent("3 kỳ gần nhất");
    for (const id of chosen) {
      expect(screen.getByTestId(`topic-line-chip-${id}`)).toBeInTheDocument();
    }
  });

  it("bộ lọc đòi nhiều kỳ hơn dữ liệu thật thì chỉ vẽ đúng số kỳ đang có", () => {
    const { container } = renderPage();
    act(() => useTimeframeStore.getState().setRange("12m"));
    // demoData có đúng 12 điểm — đây là trần thật, nhãn phải nói đúng trần đó.
    expect(chartAxis(container)).toHaveTextContent(`${maxRealMonths(demoData)} kỳ gần nhất`);
  });
});

describe("TopicsPage — mốc tour", () => {
  it("có đủ hai mốc mà lời dẫn tour trỏ vào", () => {
    const { container } = renderPage();
    expect(container.querySelector('[data-tour="topic-chart"]')).not.toBeNull();
    expect(container.querySelector('[data-tour="topic-table"]')).not.toBeNull();
  });
});
