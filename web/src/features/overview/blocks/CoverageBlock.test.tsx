import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { CoverageBlock, coverageBuckets } from "./CoverageBlock.tsx";

/* Số suy từ seed (obs.cov theo step, ngưỡng cfgDefault.step.covMin=70).
   Mở tài khoản: s1=96 s2=71 s3=64 s4=92 s5=58 s6=89 → s3 (03) và s5 (05) < 70.
   Pilot mở rộng 05/08 thêm 4 bước dưới ngưỡng: s-tra-1=63, s-tra-3=59 (tra soát nạp tiền),
   s-rut-3=61 (xác thực CCCD qua VNeID), s-rut-4=57 (chữ ký & hợp đồng rút tiền) — evidence mỏng ở
   đúng hai cổng nặng nhất của chuỗi rút là điểm nghiệp vụ, không phải số chưa điền.
   → 6 bước dưới ngưỡng trên 30 bước đã đo. Phân bố dải: ≥90 = 13 · 70-89 = 11 · 50-69 = 6 · <50 = 0. */

const covMin = cfgDefault.step.covMin;
const covOf = (stepId: string) => seed.obs.find((o) => o.stepId === stepId)!.cov;
const covs = seed.steps.map((s) => covOf(s.id));
const belowCount = covs.filter((c) => c < covMin).length;

describe("coverageBuckets — mốc chia dải suy từ ngưỡng, không ghim số", () => {
  it("covMin mặc định (70) cho bốn dải liền nhau, không hở không chồng", () => {
    const bs = coverageBuckets(70);
    expect(bs.map((b) => b.label)).toEqual(["≥ 90%", "70–89%", "50–69%", "< 50%"]);
    // Liền nhau: đáy dải trên = đỉnh dải dưới + 1.
    for (let i = 0; i < bs.length - 1; i++) expect(bs[i]!.lo).toBe(bs[i + 1]!.hi! + 1);
  });

  /* Owner đổi ngưỡng thì NHÃN phải đổi theo. Nếu ai đó ghim "70–89%" vào chuỗi cứng, đây là chỗ đỏ —
     màn khoe một ngưỡng không còn hiệu lực là đúng loại lỗi cả stream đang chữa. */
  it("đổi covMin thì dải đổi theo — 80 cho ra '80–89%', không còn '70–89%'", () => {
    const labels = coverageBuckets(80).map((b) => b.label);
    expect(labels).toContain("80–89%");
    expect(labels).not.toContain("70–89%");
  });

  it("ngưỡng trùng một mốc có sẵn thì ra BA dải, không đẻ dải rỗng", () => {
    expect(coverageBuckets(90).map((b) => b.label)).toEqual(["≥ 90%", "50–89%", "< 50%"]);
    expect(coverageBuckets(50).map((b) => b.label)).toEqual(["≥ 90%", "50–89%", "< 50%"]);
  });
});

describe("CoverageBlock — phân bố theo dải, không một thanh mỗi bước", () => {
  /* Lý do đổi thiết kế: 30 bước hôm nay, hàng trăm khi map hết. Test này là chỗ chặn nếu ai đó quay
     lại lối cũ — số thanh phải KHÔNG phụ thuộc số bước. */
  it("số thanh = số dải (4), không phải số bước (30)", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const bars = screen.getByTestId("bars");
    expect(bars.children).toHaveLength(coverageBuckets(covMin).length);
    expect(bars.children.length).toBeLessThan(seed.steps.length);
  });

  it("mỗi dải đếm đúng số bước rơi vào nó, và tổng các dải = số bước đã đo", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const bars = screen.getByTestId("bars");
    let sum = 0;
    for (const b of coverageBuckets(covMin)) {
      const want = covs.filter((c) => c >= b.lo && (b.hi === null || c <= b.hi)).length;
      const row = [...bars.children].find((el) => el.textContent?.startsWith(b.label));
      expect(row).toBeDefined();
      expect(row!.textContent).toContain(String(want));
      sum += want;
    }
    expect(sum).toBe(seed.obs.length);
  });

  it("câu chốt đếm đúng bước đạt ngưỡng, và nêu chính ngưỡng đang dùng", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByTestId("cov-headline")).toHaveTextContent(
      `${covs.length - belowCount} trên ${covs.length} bước đạt ngưỡng phủ ${covMin}%`,
    );
  });

  /* Dải phủ trả lời "đo được bao nhiêu" nhưng không chỉ được CHỖ NÀO — nên phải có danh sách mù
     nhất. Nó cắt cứng ở 3: danh sách này để chỉ chỗ, không để liệt kê hết. */
  it("nêu đích danh 3 bước mù nhất, kèm tên hành trình vì mã bước lặp giữa các flow", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const blind = within(screen.getByTestId("cov-blind"));
    const worst = seed.steps
      .map((s) => ({ s, cov: covOf(s.id) }))
      .filter((x) => x.cov < covMin)
      .sort((a, b) => a.cov - b.cov)
      .slice(0, 3);
    expect(blind.getAllByRole("listitem")).toHaveLength(3);
    for (const w of worst) {
      const flow = seed.flows.find((f) => f.id === w.s.flowId)!;
      expect(blind.getByText(`${flow.name} · ${w.s.code} ${w.s.name}`)).toBeInTheDocument();
    }
  });

  it("phần dưới ngưỡng không lọt vào danh sách thì ĐẾM RA CHỮ, không im lặng cắt", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(belowCount).toBeGreaterThan(3); // tiền đề của test
    expect(screen.getByTestId("cov-blind-more")).toHaveTextContent(
      `Xem hết ${belowCount} bước dưới ngưỡng (+${belowCount - 3} nữa)`,
    );
  });

  it("mọi bước đạt ngưỡng thì nói thẳng, không để chỗ trống cho người đọc tự đoán", () => {
    const allPass = { ...seed, obs: seed.obs.map((o) => ({ ...o, cov: 95 })) };
    render(<CoverageBlock data={allPass} cfg={cfgDefault} />);
    expect(screen.getByTestId("cov-blind")).toHaveTextContent(
      `Không bước nào đang dưới ngưỡng ${covMin}%`,
    );
    expect(screen.queryByTestId("cov-blind-more")).not.toBeInTheDocument();
  });

  /* Ba nghĩa của "trống" tách hẳn nhau: bước CHƯA ĐO không có độ phủ nên không thuộc dải nào, và
     tuyệt đối không được dồn vào dải thấp nhất — "chưa đo" khác hẳn "đo rồi, phủ kém". */
  it("bước đã khai mà chưa đo được đếm riêng, KHÔNG rơi vào dải '< 50%'", () => {
    const dropped = seed.steps.slice(0, 3);
    const partial = {
      ...seed,
      obs: seed.obs.filter((o) => !dropped.some((s) => s.id === o.stepId)),
    };
    render(<CoverageBlock data={partial} cfg={cfgDefault} />);
    expect(screen.getByTestId("cov-unmeasured")).toHaveTextContent("3 bước đã khai nhưng chưa đo");

    const bars = screen.getByTestId("bars");
    const lowest = [...bars.children].find((el) => el.textContent?.startsWith("< 50%"))!;
    const keptBelow50 = partial.obs.filter((o) => o.cov < 50).length;
    expect(lowest.textContent).toContain(String(keptBelow50));
  });

  it("chip mẫu số nói về BƯỚC (thứ chart đang vẽ), không nói về flow như bản cũ", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const flowsNoSteps = seed.flows.filter((f) => !seed.steps.some((s) => s.flowId === f.id)).length;
    expect(screen.getByTestId("denom-strip")).toHaveTextContent(
      `Đang hiện ${seed.obs.length} bước đã đo trên ${seed.steps.length} bước đã khai · ${flowsNoSteps} trên ${seed.flows.length} flow chưa khai bước nào`,
    );
  });

  /* D1 (charter Phase 2): giá trị ở khối này KHÔNG được nhân fx(). Nay `v` là SỐ BƯỚC nên bẫy đổi
     dạng — fx(13) ra một con số trông vẫn rất hợp lý cho "số bước", nên phải canh đích danh. */
  it("D1: số bước trong dải KHÔNG bị nhân fx() — hiện đúng số đếm thô", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const top = [...screen.getByTestId("bars").children].find((el) =>
      el.textContent?.startsWith("≥ 90%"),
    )!;
    const want = covs.filter((c) => c >= 90).length;
    expect(top.textContent).toContain(String(want));
    expect(top).toHaveAttribute("title", expect.stringContaining(String(want)));
  });

  /* Owner đo bằng cách dùng thật (06/08): bấm một dải mà nhảy sang bản đồ hành trình thì thấy nguyên
     một hành trình, KHÔNG thấy rõ bước nào đang thiếu dữ liệu — vì bản đồ trả lời "khách rơi ở đâu",
     không trả lời "ta mù ở đâu". Nên chi tiết độ phủ phải mở NGAY TẠI KHỐI NÀY. */
  it("bấm một dải mở danh sách bước CỦA DẢI ĐÓ tại chỗ, không nhảy sang màn khác", () => {
    const onGo = vi.fn();
    render(<CoverageBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    expect(screen.queryByTestId("cov-detail")).not.toBeInTheDocument();

    const band = coverageBuckets(covMin).find((b) => b.label === "50–69%")!;
    const bar = [...screen.getByTestId("bars").children].find((el) =>
      el.textContent?.startsWith(band.label),
    )!;
    fireEvent.click(bar);

    const detail = within(screen.getByTestId("cov-detail"));
    const want = seed.steps.filter((s) => covOf(s.id) >= band.lo && covOf(s.id) <= band.hi!);
    expect(screen.getByTestId("cov-detail")).toHaveTextContent(
      `${want.length} bước trong dải ${band.label}`,
    );
    expect(detail.getAllByRole("listitem")).toHaveLength(want.length);
    expect(onGo).not.toHaveBeenCalled();
  });

  it("danh sách mở ra nêu ĐỦ mọi bước của dải, kèm tên hành trình và độ phủ", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const band = coverageBuckets(covMin).find((b) => b.label === "50–69%")!;
    fireEvent.click(
      [...screen.getByTestId("bars").children].find((el) => el.textContent?.startsWith(band.label))!,
    );
    const detail = within(screen.getByTestId("cov-detail"));
    for (const s of seed.steps.filter((x) => covOf(x.id) >= band.lo && covOf(x.id) <= band.hi!)) {
      const flow = seed.flows.find((f) => f.id === s.flowId)!;
      expect(detail.getByText(`${flow.name} · ${s.code} ${s.name}`)).toBeInTheDocument();
    }
  });

  it("bấm lại chính dải đang mở thì đóng; nút Đóng cũng đóng", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const bar = screen.getByTestId("bars").children[0]!;
    fireEvent.click(bar);
    expect(screen.getByTestId("cov-detail")).toBeInTheDocument();
    fireEvent.click(bar);
    expect(screen.queryByTestId("cov-detail")).not.toBeInTheDocument();

    fireEvent.click(bar);
    fireEvent.click(screen.getByTestId("cov-detail-close"));
    expect(screen.queryByTestId("cov-detail")).not.toBeInTheDocument();
  });

  it("'Xem hết' mở ĐỦ mọi bước dưới ngưỡng, không chỉ ba bước mù nhất", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    fireEvent.click(screen.getByTestId("cov-blind-more"));
    const detail = within(screen.getByTestId("cov-detail"));
    expect(screen.getByTestId("cov-detail")).toHaveTextContent(
      `${belowCount} bước dưới ngưỡng ${covMin}%`,
    );
    expect(detail.getAllByRole("listitem")).toHaveLength(belowCount);
    expect(screen.getByTestId("cov-blind-more")).toHaveTextContent("Thu gọn");
  });

  /* Dải rỗng: người ta VỪA BẤM vào nó nên phải được trả lời, không được im lặng không mở gì. */
  it("bấm một dải không có bước nào thì nói ra, không im lặng", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(covs.filter((c) => c < 50)).toHaveLength(0); // tiền đề: dải '< 50%' đang rỗng
    fireEvent.click(
      [...screen.getByTestId("bars").children].find((el) => el.textContent?.startsWith("< 50%"))!,
    );
    expect(screen.getByTestId("cov-detail-empty")).toHaveTextContent("Không bước nào rơi vào dải này");
  });

  it("đường sang bản đồ hành trình vẫn còn, nhưng thành link phụ chứ không phải hành vi của thanh", () => {
    const onGo = vi.fn();
    render(<CoverageBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getByTestId("cov-go-atlas"));
    expect(onGo).toHaveBeenCalledWith("atlas");
  });
});
