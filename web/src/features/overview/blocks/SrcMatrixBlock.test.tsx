import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { SrcMatrixBlock } from "./SrcMatrixBlock.tsx";

/* Số suy từ seed qua sourceHealth() (cfgDefault.data.deadDays=2 → 48h; SLA riêng từng nguồn ở
   cfg.source): src-ga lagH4/sla6→ok · src-ekyc lagH6/sla8→ok · src-case lagH2/sla4→ok ·
   src-survey lagH12/sla6→stale · src-store lagH24/sla36→ok · src-broker lagH24/sla36→ok ·
   src-zalo lagH192≥48→down. → 2 nguồn có vấn đề: "In-app survey (CES/CSAT/NPS)" (stale) và
   "Zalo OA inbox" (down). Metric bị ảnh hưởng: src-survey→['m-ces'], src-zalo→['m-repeat'] →
   hợp nhất (Set) = 2 metric duy nhất (m-ces, m-repeat). */
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
