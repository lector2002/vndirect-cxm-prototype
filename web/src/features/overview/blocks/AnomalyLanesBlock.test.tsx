import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import type { CxmData } from "../../../data/schema/index.ts";
import { AnomalyLanesBlock } from "./AnomalyLanesBlock.tsx";

/* Số suy từ seed.ag[].f[].lane: ag-q có AF-01(pipeline) AF-02(pipeline) AF-03(behaviour) — 3 có
   lane; ag-e có AF-04(voice) AF-05(voice) — 2 có lane; ag-n có AF-06(lane:null) AF-07(voice) — 1
   có lane, 1 không (null). Tổng finding có lane !== null = 3+2+1 = 6. Theo làn: voice=3
   (AF-04,05,07) · behaviour=1 (AF-03) · pipeline=2 (AF-01,02) → 3+1+2=6 khớp tổng. */
describe("AnomalyLanesBlock", () => {
  it("tổng số cảnh báo = số finding có lane !== null (6/6, khớp ag.reduce)", () => {
    render(<AnomalyLanesBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText(/Đang hiện Top 6/)).toBeInTheDocument();
    expect(screen.getByText(/trên 6 cảnh báo/)).toBeInTheDocument();
  });

  it("render đủ 3 làn (voice/behaviour/pipeline) với đúng số phần tử mỗi làn", () => {
    render(<AnomalyLanesBlock data={seed} cfg={cfgDefault} />);
    const voice = screen.getByTestId("lane-voice");
    const behaviour = screen.getByTestId("lane-behaviour");
    const pipeline = screen.getByTestId("lane-pipeline");
    expect(voice.textContent).toContain("3");
    expect(behaviour.textContent).toContain("1");
    expect(pipeline.textContent).toContain("2");
  });

  it("finding lane=null (AF-06) không thuộc 3 làn, hiện dòng ghi chú riêng", () => {
    render(<AnomalyLanesBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText(/1 mục không phải bất thường/)).toBeInTheDocument();
  });

  it("không có finding nào có lane → 0 cảnh báo, không còn dòng ghi chú lane=null", () => {
    const data: CxmData = {
      ...seed,
      ag: seed.ag.map((g) => ({ ...g, f: g.f.map((f) => ({ ...f, lane: null })) })),
    };
    render(<AnomalyLanesBlock data={data} cfg={cfgDefault} />);
    expect(screen.getByText(/Đang hiện Top 0/)).toBeInTheDocument();
    expect(screen.getByText(/trên 0 cảnh báo/)).toBeInTheDocument();
  });
});
