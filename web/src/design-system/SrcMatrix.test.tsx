import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../data/fixtures/seed.ts";
import { sourceHealth } from "../domain/state.ts";
import { SrcMatrix } from "./SrcMatrix.tsx";

/* Suy lại từ seed thật (không hardcode số) — nhưng có in ra để đối chiếu:
   7 nguồn, sourceHealth theo cfgDefault: src-ga/ekyc/case/store/broker = ok, src-survey = stale,
   src-zalo = down → 2 nguồn !== 'ok'. Nguồn pf:[] = src-broker, src-zalo (đúng 2 nguồn "hai nguồn
   không gắn nền tảng nào" trong comment gốc) — src-zalo trong số đó đang 'down'. */
describe("SrcMatrix", () => {
  it("số hàng = sources.length", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} />);
    const table = screen.getByTestId("src-matrix");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(seed.sources.length);
  });

  it("số dấu không-phải-● ở cột Trạng thái khớp số nguồn health !== 'ok'", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} />);
    const marks = screen.getAllByTestId("src-health");
    expect(marks).toHaveLength(seed.sources.length);
    const notOk = marks.filter((m) => m.textContent !== "●");
    const expectedNotOk = seed.sources.filter((s) => sourceHealth(s, cfgDefault) !== "ok");
    expect(notOk).toHaveLength(expectedNotOk.length);
    expect(expectedNotOk.map((s) => s.id).sort()).toEqual(["src-survey", "src-zalo"]);
  });

  it("nguồn có pf: [] hiện đủ 4 dấu '–' ở 4 cột nền tảng (src-broker, src-zalo)", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} />);
    const noPf = seed.sources.filter((s) => !s.pf.length);
    expect(noPf.map((s) => s.id).sort()).toEqual(["src-broker", "src-zalo"]);
    for (const s of noPf) {
      const row = screen.getByTestId(`src-row-${s.id}`);
      const dashes = within(row).getAllByText("–");
      expect(dashes).toHaveLength(4);
    }
  });

  it("nguồn đang 'down' (src-zalo) vẫn đọc được trạng thái ở cột Trạng thái dù 4 cột nền tảng đều '–'", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} />);
    const row = screen.getByTestId("src-row-src-zalo");
    const health = within(row).getByTestId("src-health");
    expect(health.textContent).toBe("✕");
    expect(within(row).getByText("Ngừng gửi")).toBeInTheDocument();
  });

  it("compact=true ẩn cột metric, giữ cột Trạng thái", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} compact />);
    expect(screen.queryByText("Nguồn này sai thì metric nào sai")).not.toBeInTheDocument();
    expect(screen.getByText("Trạng thái")).toBeInTheDocument();
  });

  it("compact=true cắt tên nguồn trong ngoặc và ẩn note (src-ga: 'Digital analytics (app + web)')", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} compact />);
    const row = screen.getByTestId("src-row-src-ga");
    expect(within(row).getByText("Digital analytics")).toBeInTheDocument();
    expect(within(row).queryByText(/\(app \+ web\)/)).not.toBeInTheDocument();
    expect(within(row).queryByText("Nguồn funnel chính")).not.toBeInTheDocument();
  });

  it("compact=false giữ tên đầy đủ + note nguồn", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} />);
    const row = screen.getByTestId("src-row-src-ga");
    expect(within(row).getByText("Digital analytics (app + web)")).toBeInTheDocument();
    expect(within(row).getByText("Nguồn funnel chính")).toBeInTheDocument();
  });

  it("cột metric hiện TÊN metric (tra từ seed.metrics), không phải id thô — src-ekyc: m-liveness, m-ocr", () => {
    render(<SrcMatrix sources={seed.sources} metrics={seed.metrics} cfg={cfgDefault} />);
    const row = screen.getByTestId("src-row-src-ekyc");
    expect(within(row).getByText("Liveness completion")).toBeInTheDocument();
    expect(within(row).getByText("Evidence coverage bước OCR")).toBeInTheDocument();
    expect(within(row).queryByText("m-liveness")).not.toBeInTheDocument();
  });
});
