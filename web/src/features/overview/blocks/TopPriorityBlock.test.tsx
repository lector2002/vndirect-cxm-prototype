import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, dims, seed } from "../../../data/fixtures/seed.ts";
import { PRI_LABEL, scoreIssues } from "../../../data/priority.ts";
import type { PriKey } from "../../../data/schema/index.ts";
import { TopPriorityBlock } from "./TopPriorityBlock.tsx";

/* Bộ test cũ ghim thứ hạng thành số cụ thể (`imp.aff → CXI-024(730) > CXI-021(312) > …`) vì mọi số
   đó là hằng gõ tay trong fixture. Chúng biến mất cùng `iss[].pri` và `imp.aff`/`imp.hv`/`imp.csat`
   (ADR-002 §1, §12, §16), nên bộ test này suy lại toàn bộ từ chính `scoreIssues`.

   BA card, không bốn: "Top theo tác động CES" đã bỏ (§12) — nó đọc `imp.csat` gõ tay và không nối
   với `m-ces` bằng đường code nào. */

const CARDS: readonly PriKey[] = ["aff", "hv", "reg"];

/* "Đang mở" = có action chưa khép vòng — cùng vị từ mà block dùng, suy lại chứ không chép số. */
const open = seed.iss.filter((i) => {
  const a = seed.act.find((x) => x.id === i.act);
  return a !== undefined && a.lc !== "closed";
});
const scores = scoreIssues(seed, cfgDefault, dims);
const measured = (k: PriKey) => open.filter((i) => scores.get(i.id)?.x[k] !== null);
/* 25/08 (owner, quét AI-slop): card 0 dòng đo được render EMPTY-STATE thay vì chart trục trống —
   nên số phần tử `bars` = số card CÓ dòng, và mọi phép chiếu bars[idx] phải đi qua danh sách lọc
   này thay vì CARDS thô. */
const cardsWithRows: readonly PriKey[] = CARDS.filter((k) => measured(k).length > 0);

describe("TopPriorityBlock", () => {
  it("render đúng ba card; card không đo được trục nào hiện empty-state thay vì chart trống", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} dims={dims} />);
    for (const k of CARDS) {
      expect(screen.getByText(`Top theo ${PRI_LABEL[k].toLowerCase()}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId("bars")).toHaveLength(cardsWithRows.length);
    const emptyCount = CARDS.length - cardsWithRows.length;
    expect(screen.queryAllByTestId("toppriority-empty")).toHaveLength(emptyCount);
  });

  it("card CES đã bỏ hẳn — không còn tiêu đề lẫn đơn vị của nó", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} dims={dims} />);
    expect(screen.queryByText(/tác động CES/)).not.toBeInTheDocument();
    expect(screen.queryByText(/điểm CES × 10/)).not.toBeInTheDocument();
  });

  it("mỗi card chỉ liệt kê điểm gãy ĐO ĐƯỢC trục đó, không xếp cái chưa tính được xuống cuối", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} dims={dims} />);
    const bars = screen.getAllByTestId("bars");
    cardsWithRows.forEach((k, idx) => {
      expect(bars[idx].children).toHaveLength(Math.min(measured(k).length, 10));
    });
  });

  it("phần chưa tính được của mỗi card được ĐẾM RA CHỮ, không im lặng biến mất", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} dims={dims} />);
    for (const k of CARDS) {
      const unmeasured = open.length - measured(k).length;
      if (unmeasured === 0) continue;
      // Card có dòng: đếm ở dải mẫu số. Card 0 dòng: đếm trong chính câu empty-state.
      const pattern =
        measured(k).length > 0
          ? new RegExp(`${unmeasured} chưa tính được trục này`)
          : new RegExp(`${unmeasured} điểm gãy đang mở chưa có dữ liệu`);
      expect(screen.getAllByText(pattern).length).toBeGreaterThan(0);
    }
  });

  it("điểm gãy đã khép vòng không có mặt ở card nào", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} dims={dims} />);
    const closedAct = seed.act.find((a) => a.lc === "closed");
    if (!closedAct) return;
    const closedIssue = seed.iss.find((i) => i.act === closedAct.id);
    if (!closedIssue) return;
    for (const b of screen.getAllByTestId("bars")) {
      expect(b.textContent).not.toContain(closedIssue.title);
    }
  });

  it("thứ tự trong mỗi card giảm dần theo chính số đo của khoá đó", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} dims={dims} />);
    const bars = screen.getAllByTestId("bars");
    cardsWithRows.forEach((k, idx) => {
      const expected = measured(k)
        .slice()
        .sort((a, b) => (scores.get(b.id)?.x[k] as number) - (scores.get(a.id)?.x[k] as number))
        .slice(0, 10);
      expected.forEach((i, row) => {
        expect(bars[idx].children[row]?.textContent).toContain(i.title);
      });
    });
  });
});
