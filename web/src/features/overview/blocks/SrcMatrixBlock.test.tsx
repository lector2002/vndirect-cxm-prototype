import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { SrcMatrixBlock } from "./SrcMatrixBlock.tsx";

/* 07/08 (module-i-signal-registry-charter.md I3): số suy từ seed qua sourceHealth(), giờ so
   `Source.last` với `seed.asOf` ("27/07/2026"), theo NGÀY — không còn so `lagH` với SLA riêng
   (`cfg.source`). src-ga/ekyc/case/store/broker: last = 27/07 → thiếu 0 ngày → ok. src-survey:
   last = 26/07 → thiếu 1 ngày, vol=612>0 → stale. src-zalo: last = 19/07 → thiếu 8 ngày ≥
   deadDays 2 → down. → CÙNG kết luận như cách chấm cũ: 2 nguồn có vấn đề — "In-app survey
   (CES/CSAT/NPS)" (stale) và "Zalo OA inbox" (down). Metric bị ảnh hưởng: src-survey→['m-ces'],
   src-zalo→['m-repeat'] → hợp nhất (Set) = 2 metric duy nhất (m-ces, m-repeat). */
describe("SrcMatrixBlock", () => {
  it("wHead: Đang hiện Top N trên N nguồn (N = tổng số nguồn)", () => {
    render(<SrcMatrixBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText(new RegExp(`Đang hiện Top ${seed.sources.length}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`trên ${seed.sources.length} nguồn`))).toBeInTheDocument();
  });

  it("render bảng SrcMatrix compact (không cột metric)", () => {
    render(<SrcMatrixBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByTestId("src-matrix")).toBeInTheDocument();
    expect(screen.queryByText("Nguồn này sai thì metric nào sai")).not.toBeInTheDocument();
  });
});
