import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { demoData, recountDemoSignals } from "../../data/fixtures/demo.ts";
import { createCxmStore } from "../../store/store.ts";
import {
  flowHasSourceCitation,
  flowStepsCopied,
  metricsWithoutSignal,
  sigCountReliability,
  sourceHealth,
  stepsWithoutRunningSignal,
} from "../../domain/index.ts";
import { MISSING } from "../../data/segment.ts";
import { SignalHealthNoti } from "./SignalHealthNoti.tsx";

/* Owner 18/08 tối: hai khối "Declared vs observed" + "Data trust" rời #/signals thành noti
   chỉ-hiện-khi-lệch ở CXM Overview. Các test dưới PORT nguyên phép đếm lại từ SignalsPage.test.tsx
   (mọi số đếm lại từ fixture bằng chính hàm domain, không ghim — §7 charter); phần "render được
   trên trang, đúng sec" nằm ở OverviewPage.test.tsx. */

function demoState() {
  return createCxmStore(new MockRepository(demoData, recountDemoSignals)).getState();
}
function seedState() {
  return createCxmStore(new MockRepository()).getState();
}

/* 25/08 (owner duyệt audit đọc-hiểu): hộp noti gập mặc định thành một dòng đếm — mọi test đọc
   từng dòng phải xoè hộp ngoài trước. Câu chữ từng dòng không đổi nên các phép đếm giữ nguyên. */
function expandNoti() {
  fireEvent.click(screen.getByTestId("signal-health-noti-toggle"));
}

describe("noti gov — dòng mang đủ HAI cặp N/M đếm lại (port test gov-summary cũ)", () => {
  it("N/M của T1 và T3 trên dòng noti khớp phép đếm domain", () => {
    const { data, cfg, dims } = demoState();
    const evaluated = data.flows.filter((f) => flowHasSourceCitation(f) || flowStepsCopied(f, data.steps));
    const cited = evaluated.filter((f) => flowHasSourceCitation(f) && !flowStepsCopied(f, data.steps));
    const broken = data.sources.filter(
      (s) => sourceHealth(s, cfg, data.asOf) === "down" && s.metrics.length > 0,
    );
    expect(cited.length + broken.length).toBeGreaterThan(0); // tiền đề: demoData có lệch để noti hiện

    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    expandNoti();
    const msg = screen.getByTestId("noti-gov").textContent ?? "";
    expect(msg).toContain(`${cited.length} / ${evaluated.length}`);
    expect(msg).toContain(`${broken.length} / ${data.sources.length}`);
  });

  it("gấp mặc định — bấm Details mới bung đúng khối chi tiết cũ (gov-t1/gov-t3)", () => {
    const { data, cfg, dims } = demoState();
    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    expandNoti();
    expect(screen.queryByTestId("gov-t1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("noti-gov-toggle"));
    expect(screen.getByTestId("gov-t1")).toBeInTheDocument();
    expect(screen.getByTestId("gov-t3")).toBeInTheDocument();
  });
});

describe("noti reliability — hai hướng của owner chốt 07/08 phương án (a), port từ màn signals", () => {
  it("(a) seed: sigCounts rỗng ⇒ noti nói CHƯA NHẬN số đếm; bung ra thấy reliability-empty, KHÔNG bảng", () => {
    const { data, cfg, dims } = seedState();
    expect(data.sigCounts.length).toBe(0);
    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    expandNoti();
    expect(screen.getByTestId("noti-reliability").textContent).toContain("Chưa nhận được số đếm");
    fireEvent.click(screen.getByTestId("noti-reliability-toggle"));
    expect(screen.getByTestId("reliability-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("reliability-table")).not.toBeInTheDocument();
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
  });

  it("(b) demoData: dòng noti đếm đúng số dimension đo thiếu; cột 'thiếu' trong bảng đúng là MISSING đếm lại", () => {
    const { data, cfg, dims } = demoState();
    const rows = sigCountReliability(data);
    const gapDims = rows.filter((r) => r.missing > 0);
    const target = gapDims[0];
    expect(target).toBeDefined(); // tiền đề: demoData có dimension đo thiếu để noti hiện
    const expectedMissing = data.sigCounts
      .filter((c) => c.dim === target!.dim && c.band === MISSING)
      .reduce((a, c) => a + c.n, 0);
    expect(expectedMissing).toBe(target!.missing);

    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    expandNoti();
    expect(screen.getByTestId("noti-reliability").textContent).toContain(
      `${gapDims.length} / ${rows.length}`,
    );
    fireEvent.click(screen.getByTestId("noti-reliability-toggle"));
    expect(screen.getByTestId("reliability-table")).toBeInTheDocument();
    const row = screen.getByTestId(`reliability-row-${target!.dim}`);
    expect(within(row).getAllByRole("cell")[2].textContent).toContain(String(expectedMissing));
  });
});

describe("noti coverage — T4·T7 rời khối ① màn signals (owner 18/08 tối, sửa §6 lần bốn)", () => {
  it("dòng mang đủ: hai số bước LỒNG TRONG MỘT CÂU (T4, tiêu chí 7) + chỉ số không ai nuôi (T7), đếm lại", () => {
    const { data, cfg, dims } = demoState();
    const { none, noneRunning } = stepsWithoutRunningSignal(data);
    const orphan = metricsWithoutSignal(data);
    expect(noneRunning.length + orphan.length).toBeGreaterThan(0); // tiền đề: demoData có lệch coverage

    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    expandNoti();
    const msg = screen.getByTestId("noti-coverage").textContent ?? "";
    expect(msg).toMatch(
      new RegExp(`${noneRunning.length}\\s*/\\s*${data.steps.length}.*trong đó.*${none.length}`, "s"),
    );
    expect(msg).toContain(`${orphan.length} / ${data.metrics.length}`);
  });

  it("dòng coverage KHÔNG có nút Details — hai con số là toàn bộ nội dung", () => {
    const { data, cfg, dims } = demoState();
    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    expandNoti();
    expect(screen.getByTestId("noti-coverage")).toBeInTheDocument();
    expect(screen.queryByTestId("noti-coverage-toggle")).not.toBeInTheDocument();
  });
});

describe("hộp noti gập mặc định (owner duyệt audit đọc-hiểu 25/08)", () => {
  it("mặc định chỉ hiện dòng đếm — số lưu ý đếm lại từ chính các dòng sẽ xoè; câu chữ giữ nguyên khi xoè", () => {
    const { data, cfg, dims } = demoState();
    render(<SignalHealthNoti data={data} cfg={cfg} dims={dims} />);
    // đếm lại từ fixture: dòng nào có lệch thì mới được tính (không ghim số 3)
    const rowIds = ["noti-gov", "noti-coverage", "noti-reliability"];
    expect(screen.queryByTestId("noti-gov")).not.toBeInTheDocument();
    expect(screen.queryByTestId("noti-coverage")).not.toBeInTheDocument();
    expect(screen.queryByTestId("noti-reliability")).not.toBeInTheDocument();
    const toggle = screen.getByTestId("signal-health-noti-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const shown = rowIds.filter((id) => screen.queryByTestId(id) !== null).length;
    expect(shown).toBeGreaterThan(0);
    expect(toggle.textContent).toContain(`${shown} lưu ý về dữ liệu điểm đo`);

    fireEvent.click(toggle);
    expect(screen.queryByTestId("noti-gov")).not.toBeInTheDocument();
  });
});

describe("không có gì lệch → không render gì (nguyên tắc noti ngoại lệ)", () => {
  it("bản sao dữ liệu đã dọn sạch lệch (flows/sources/steps/metrics rỗng, sigCounts không còn MISSING) ⇒ null", () => {
    const { data, cfg, dims } = demoState();
    const quiet = {
      ...data,
      flows: [],
      sources: [],
      steps: [],
      metrics: [],
      sigCounts: data.sigCounts.filter((c) => c.band !== MISSING),
    };
    expect(quiet.sigCounts.length).toBeGreaterThan(0); // tiền đề: vẫn CÓ số đếm, chỉ hết lệch
    const { container } = render(<SignalHealthNoti data={quiet} cfg={cfg} dims={dims} />);
    expect(container.firstChild).toBeNull();
  });
});
