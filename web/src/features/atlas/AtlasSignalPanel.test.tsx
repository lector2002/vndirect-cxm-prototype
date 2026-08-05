import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dims, seed } from "../../data/fixtures/seed.ts";
import { demoData } from "../../data/fixtures/demo.ts";
import type { SigCount, Signal, Touchpoint } from "../../data/schema/index.ts";
import { signalChart } from "../../domain/index.ts";
import { nf } from "../../design-system/format.ts";
import { AtlasSignalPanel } from "./AtlasSignalPanel.tsx";
import { AtlasPage } from "./AtlasPage.tsx";

/* Số dùng trong test này LUÔN dựng từ `seed`/`demoData`/`signalChart` thật, không hand-copy hằng số
   (chỉ ngoại lệ ở nhóm "nút chiều 2/3" cuối file — xem lý do ngay tại đó). `rows` truyền vào panel
   luôn là `demoData.sigCounts` (đường thật, cùng chỗ signalChart.test.ts dùng) — `seed.sigCounts`
   rỗng (Demo Mode tắt), không hợp cho test hành vi có chart. */

const tp1 = seed.touchpoints.find((t) => t.id === "tp1")!; // s1 — sg1 (vol 614), sg2 (vol 2840)
const tp2 = seed.touchpoints.find((t) => t.id === "tp2")!; // s2 — sg3 (vol 920, success/fail), sg4 (vol 410)
/* Ca "signal gap" 05/08 chuyển từ tp3 sang tp-nap-1: `sg6 ekyc_face_device_context` đã bỏ (chiều Nền
   tảng trả lời sẵn câu nó định hỏi) nên tp3 không còn signal vol 0 nào. tp-nap-1 có ĐÚNG hình dạng cũ
   — một signal live đứng cạnh một signal gap vol 0 — nên hành vi được kiểm vẫn y nguyên, chỉ đổi chỗ. */
const tpNap = seed.touchpoints.find((t) => t.id === "tp-nap-1")!; // s-nap-1 — sg-nap-1 (live), sg-nap-4 (gap, vol 0)
const s1 = seed.steps.find((s) => s.id === "s1")!;
const s2 = seed.steps.find((s) => s.id === "s2")!;
const sNap = seed.steps.find((s) => s.id === "s-nap-1")!;

const tp1Signals = seed.signals.filter((g) => g.tpId === tp1.id);
const tp2Signals = seed.signals.filter((g) => g.tpId === tp2.id);
const tpNapSignals = seed.signals.filter((g) => g.tpId === tpNap.id);
const [sg1, sg2] = tp1Signals;
const [sg3] = tp2Signals;
const [sgNapLive, sgNapGap] = tpNapSignals;

describe("AtlasSignalPanel — bảng signal (checkbox) + chart điểm đo + panel gắn ở đâu", () => {
  it("a) mở ra đã có chart của signal vol>0 ĐẦU TIÊN theo thứ tự khai", () => {
    render(<AtlasSignalPanel signals={tp1Signals} touchpoints={[tp1]} rows={demoData.sigCounts} dims={dims} stationId={s1.stationId} />);

    const first = tp1Signals.find((s) => s.vol > 0)!;
    expect(first.id).toBe(sg1.id); // sg1 khai trước sg2 và cả hai đều vol>0
    expect(screen.getByTestId(`atlas-sigpick-${sg1.id}`)).toBeChecked();
    expect(screen.getByTestId("signal-columns")).toBeInTheDocument();
    expect(screen.getByTestId(`sigcol-group-${sg1.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`sigcol-group-${sg2.id}`)).not.toBeInTheDocument();
  });

  it("b) bỏ tick signal đang chọn duy nhất → hiện câu mời chọn, KHÔNG có chart", () => {
    render(<AtlasSignalPanel signals={tp1Signals} touchpoints={[tp1]} rows={demoData.sigCounts} dims={dims} stationId={s1.stationId} />);

    fireEvent.click(screen.getByTestId(`atlas-sigpick-${sg1.id}`));

    expect(screen.getByText("Chọn ít nhất một điểm đo ở bảng trên để xem chart.")).toBeInTheDocument();
    expect(screen.queryByTestId("signal-columns")).not.toBeInTheDocument();
  });

  it("c) tick thêm signal thứ hai → chart có hai nhóm cột", () => {
    render(<AtlasSignalPanel signals={tp1Signals} touchpoints={[tp1]} rows={demoData.sigCounts} dims={dims} stationId={s1.stationId} />);

    fireEvent.click(screen.getByTestId(`atlas-sigpick-${sg2.id}`)); // sg1 vẫn đang chọn sẵn (mặc định)

    expect(screen.getByTestId(`sigcol-group-${sg1.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`sigcol-group-${sg2.id}`)).toBeInTheDocument();
    expect(screen.getAllByTestId(/^sigcol-group-/)).toHaveLength(2);
  });

  it("d) tick riêng một signal gap (vol=0) → hiện ĐÚNG câu notes[].reason, không có nhóm cột nào", () => {
    render(<AtlasSignalPanel signals={tpNapSignals} touchpoints={[tpNap]} rows={demoData.sigCounts} dims={dims} stationId={sNap.stationId} />);

    fireEvent.click(screen.getByTestId(`atlas-sigpick-${sgNapLive.id}`)); // bỏ signal live (đang chọn mặc định)
    fireEvent.click(screen.getByTestId(`atlas-sigpick-${sgNapGap.id}`)); // chọn signal gap

    const expectedReason = signalChart(demoData.sigCounts, tpNapSignals, dims, [sgNapGap.id], "nav").notes[0].reason;
    expect(screen.getByText(expectedReason)).toBeInTheDocument();
    expect(screen.queryByTestId("signal-columns")).not.toBeInTheDocument();
  });

  it("e) đổi chiều: bar (cột) giữ nguyên total, lát bên trong đổi nhãn", () => {
    render(<AtlasSignalPanel signals={tp2Signals} touchpoints={[tp2]} rows={demoData.sigCounts} dims={dims} stationId={s2.stationId} />);

    const barBefore = screen.getByTestId(`sigcol-bar-${sg3.id}-success`);
    const totalBefore = barBefore.textContent;
    const sliceLabelsBefore = [...barBefore.querySelectorAll("[data-testid^='sigcol-slice-']")].map((el) =>
      el.getAttribute("data-testid"),
    );

    fireEvent.click(screen.getByTestId("atlas-dim-acq"));

    const barAfter = screen.getByTestId(`sigcol-bar-${sg3.id}-success`);
    expect(barAfter.textContent).toBe(totalBefore); // §9-2: cùng cột, cùng total hiện trên cột
    const sliceLabelsAfter = [...barAfter.querySelectorAll("[data-testid^='sigcol-slice-']")].map((el) =>
      el.getAttribute("data-testid"),
    );
    expect(sliceLabelsAfter).not.toEqual(sliceLabelsBefore); // lát đổi theo chiều mới
  });

  it("f) đổi qua lại giữa BỐN chiều khách → tổng mỗi cột (bar.total) KHÔNG đổi", () => {
    // Đối chiếu độc lập qua chính signalChart (không đọc lại DOM để tự chứng minh DOM) — total của
    // cột 'success' phải giống nhau ở cả bốn chiều khách (§9-4): mỗi lần bắn luôn ghi đủ dòng ở CẢ
    // bốn chiều khách (data/projectSignalCounts.ts), nên đổi chiều không đổi được Σn của một val.
    const successTotalByDim = (["acq", "nav", "age", "tier"] as const).map(
      (dimId) => signalChart(demoData.sigCounts, tp2Signals, dims, [sg3.id], dimId).groups[0].cols[0].total,
    );
    for (const total of successTotalByDim) expect(total).toBe(successTotalByDim[0]);
    const expectedText = nf(successTotalByDim[0]);

    render(<AtlasSignalPanel signals={tp2Signals} touchpoints={[tp2]} rows={demoData.sigCounts} dims={dims} stationId={s2.stationId} />);
    for (const dimId of ["acq", "nav", "age", "tier"]) {
      fireEvent.click(screen.getByTestId(`atlas-dim-${dimId}`));
      expect(screen.getByTestId(`sigcol-bar-${sg3.id}-success`)).toHaveTextContent(expectedText);
    }
  });

  it("h) chiều sigpf hiện tên đẹp 'iOS'/'Android' qua PF_LABEL, KHÔNG hiện chữ thô 'ios'/'android'", () => {
    render(<AtlasSignalPanel signals={tp2Signals} touchpoints={[tp2]} rows={demoData.sigCounts} dims={dims} stationId={s2.stationId} />);

    fireEvent.click(screen.getByTestId("atlas-dim-sigpf"));

    expect(screen.getByText("iOS")).toBeInTheDocument();
    expect(screen.getByText("Android")).toBeInTheDocument();
    expect(screen.queryByText("ios")).not.toBeInTheDocument();
    expect(screen.queryByText("android")).not.toBeInTheDocument();
  });

  it("i) panel Đ4 hiện đủ điểm tiếp xúc + event + client/server + nền tảng + mã trạm, và nói rõ giới hạn", () => {
    render(<AtlasSignalPanel signals={tp2Signals} touchpoints={[tp2]} rows={demoData.sigCounts} dims={dims} stationId={s2.stationId} />);

    const expectedLine = `Điểm tiếp xúc: ${tp2.name} (kênh ${tp2.channel}) · event ${sg3.name} · phía client · iOS, Android · trạm ${s2.stationId}`;
    expect(screen.getByTestId(`atlas-where-${sg3.id}`)).toHaveTextContent(expectedLine);
    expect(screen.getByText(/chưa phải vị trí kỹ thuật/)).toBeInTheDocument();
    expect(screen.getByText(/Bảng D/)).toBeInTheDocument();
  });

  it("constraint 1: bảng vẫn đủ 6 cột gốc + đúng câu chữ header, chỉ thêm cột checkbox ở đầu", () => {
    render(<AtlasSignalPanel signals={tp1Signals} touchpoints={[tp1]} rows={demoData.sigCounts} dims={dims} stationId={s1.stationId} />);

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers.slice(1)).toEqual(["Event", "Nguồn", "Platform", "Volume/ngày", "Lần thấy cuối", "Trạng thái"]);
    for (const g of tp1Signals) expect(screen.getByTestId(`atlas-signal-${g.id}`)).toBeInTheDocument();
  });

  it("tích hợp qua AtlasPage (KHÔNG chỉ prop cô lập): bấm bước s1 → chart điểm đo THẬT hiện ra qua đủ dây store → AtlasStepInspector → AtlasSignalPanel — nếu data.sigCounts từ store rỗng, nav sẽ hoá 'locked' và test này đỏ mà 9 test bên trên (truyền rows={demoData.sigCounts} trực tiếp) không phát hiện được", () => {
    const pilotFlow = seed.flows.find((f) => f.observed)!;
    render(<AtlasPage />);

    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${s1.id}`));

    expect(screen.getByTestId("signal-columns")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-dim-nav")).not.toBeDisabled();
  });
});

/* `partial` KHÔNG PHẢI "fixture hiện tại chưa có ca" — mà là CẤU TRÚC không cho phép với dữ liệu hợp
   lệ. `data/validate.ts` ràng buộc 1 (dòng ~684-694) buộc tổng n của MỘT CHIỀU bất kỳ (trong cả năm
   chiều, Map khởi tạo sẵn = 0 nên một chiều vắng hẳn cũng bị bắt) phải bằng đúng `Signal.vol` — nên
   với dữ liệu ĐÃ QUA validate, một chiều không thể có coverage lệch (0 < coverage < expected, tức
   `partial`) HAY vắng hẳn (coverage=0 khi vol>0, tức `locked` CHO RIÊNG chiều đó) trong khi các chiều
   khác đủ: cả hai đều là chính lỗi mà ràng buộc 1 bắt. Ca `locked` DUY NHẤT dữ liệu hợp lệ sinh ra
   được là khi `data.sigCounts` RỖNG TOÀN BỘ (không phải rỗng riêng một signal) — validate.ts dòng
   656-665 gọi đây là "trạng thái trống TRUNG THỰC của toàn hệ thống" (Demo Mode tắt) và bỏ qua ba
   ràng buộc, nên nó lọt qua hợp lệ; khi đó byDim toàn 0 cho MỌI chiều, tức CẢ NĂM cùng locked một
   lượt — test "ca 1" ngay dưới đo ca này bằng `seed.sigCounts` thật, không dựng tay. Ca `locked` chỉ-
   một-chiều (các chiều khác vẫn full) thì KHÔNG có đường nào trong dữ liệu hợp lệ đi tới được — đúng
   lý do như `partial` — nên vẫn phải dựng tay ở test (g) dưới (fixture đó tự ý phá luôn ràng buộc 1
   để tạo ra ca chỉ tồn tại trên nhánh code, không tồn tại trên dữ liệu thật). */

it("ĐO (không suy): với MỌI bước × tập con signal-sống-của-bước-đó trong seed/demoData, cả năm dimStates đều 'full' — pin số đo thật thành assertion để nếu fixture đổi và xuất hiện partial/locked thật, test này báo đỏ trước khi báo cáo dựa vào một tuyên bố đã cũ", () => {
  let sawAnyLiveCombo = false;
  for (const step of seed.steps) {
    const stepTps = seed.touchpoints.filter((t) => t.stepId === step.id);
    const stepSignals = seed.signals.filter((g) => stepTps.some((t) => t.id === g.tpId));
    const liveIds = stepSignals.filter((s) => s.vol > 0).map((s) => s.id);
    if (liveIds.length === 0) continue;
    sawAnyLiveCombo = true;
    const { dimStates } = signalChart(demoData.sigCounts, stepSignals, dims, liveIds, "nav");
    expect(dimStates.every((d) => d.state === "full")).toBe(true);
  }
  expect(sawAnyLiveCombo).toBe(true); // tự chống rỗng: phải có ít nhất một bước có signal sống để đo
});

it("ca 1 — locked CẢ NĂM chiều cùng lúc, bằng dữ liệu THẬT (seed.sigCounts rỗng toàn bộ, không dựng tay): không mời bấm chiều khác (không nút nào bấm được), không nhắc 'Demo Mode', nói đúng nguyên nhân là chưa có dòng đếm nào cho lựa chọn hiện tại", () => {
  expect(seed.sigCounts).toEqual([]); // chốt tiền đề: đúng ca "trống toàn bộ" mà validate.ts cho là hợp lệ

  render(<AtlasSignalPanel signals={tp1Signals} touchpoints={[tp1]} rows={seed.sigCounts} dims={dims} stationId={s1.stationId} />);

  // sg1 (vol>0) vẫn được chọn sẵn theo Rule 2 — không có gì đổi ở khâu chọn signal.
  expect(screen.getByTestId(`atlas-sigpick-${sg1.id}`)).toBeChecked();

  // Không vẽ chart, không nút chiều nào bấm được, và KHÔNG còn câu "chọn một chiều khác" (lời mời đó
  // không làm được vì mọi nút đều disabled — đúng lỗi coordinator chỉ ra).
  expect(screen.queryByTestId("signal-columns")).not.toBeInTheDocument();
  expect(screen.queryByText(/chọn một chiều khác/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Demo Mode/i)).not.toBeInTheDocument();
  for (const dimId of ["acq", "nav", "age", "tier", "sigpf"]) {
    expect(screen.getByTestId(`atlas-dim-${dimId}`)).toBeDisabled();
  }
  expect(
    screen.getByText(/Chưa có dòng đếm nào cho lựa chọn điểm đo hiện tại ở bất kỳ chiều nào/),
  ).toBeInTheDocument();
});

describe("AtlasSignalPanel — nút chiều 'partial'/'locked, chỉ MỘT chiều' (fixture dựng tay — dữ liệu hợp lệ không sinh nổi ca này, xem lý do ràng buộc 1 validate.ts ở comment trên)", () => {
  const tpX: Touchpoint = { id: "tp-x", stepId: "s-x", name: "TP X", channel: "app", owner: "X", users: 0, desc: "" };
  const sigA: Signal = { id: "sig-a", tpId: "tp-x", name: "evt_a", st: "live", pf: ["ios"], es: "client", vol: 10, seen: null, metrics: [], desc: "", values: ["x"] };
  const sigB: Signal = { id: "sig-b", tpId: "tp-x", name: "evt_b", st: "live", pf: ["ios"], es: "client", vol: 10, seen: null, metrics: [], desc: "", values: ["x"] };
  const rows: SigCount[] = [
    // sigA: đủ cả năm chiều — full ở mọi nơi khi CHỈ sigA được chọn.
    { sig: "sig-a", dim: "acq", val: "x", band: "X", n: 10 },
    { sig: "sig-a", dim: "nav", val: "x", band: "X", n: 10 },
    { sig: "sig-a", dim: "age", val: "x", band: "X", n: 10 },
    { sig: "sig-a", dim: "tier", val: "x", band: "X", n: 10 },
    { sig: "sig-a", dim: "sigpf", val: "x", band: "ios", n: 10 },
    // sigB: KHÔNG có dòng nav nào (locked khi chỉ chọn sigB), acq chỉ 6/10 (partial 40%).
    { sig: "sig-b", dim: "acq", val: "x", band: "X", n: 6 },
    { sig: "sig-b", dim: "age", val: "x", band: "X", n: 10 },
    { sig: "sig-b", dim: "tier", val: "x", band: "X", n: 10 },
    { sig: "sig-b", dim: "sigpf", val: "x", band: "ios", n: 10 },
  ];

  it("g) ca 2 (CHỈ MỘT chiều locked, các chiều khác vẫn full/partial — không đạt được bằng seed/demoData vì phá ràng buộc 1 validate.ts, phải dựng tay): đổi lựa chọn signal khiến chiều đang chọn ('nav', mặc định) hoá locked: KHÔNG tự nhảy chiều, lời mời 'chọn chiều khác' vẫn ĐÚNG vì acq còn bấm được, nút acq báo đúng % partial, nút nav bị khoá đúng câu", () => {
    render(<AtlasSignalPanel signals={[sigA, sigB]} touchpoints={[tpX]} rows={rows} dims={dims} stationId="JS-TEST-01" />);

    // Mở ra: chỉ sigA (đầu tiên vol>0) được chọn, nav full → có chart, không có nút nào bị khoá.
    expect(screen.getByTestId("signal-columns")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-dim-nav")).not.toBeDisabled();

    // Đổi lựa chọn: bỏ sigA, chọn sigB — nav từ full hoá locked (không có dòng nav nào cho sigB).
    fireEvent.click(screen.getByTestId("atlas-sigpick-sig-a"));
    fireEvent.click(screen.getByTestId("atlas-sigpick-sig-b"));

    // Rule 5: KHÔNG tự nhảy sang chiều khác — nút "nav" vẫn là nút đang chọn (aria-pressed), chỉ bị khoá.
    const navBtn = screen.getByTestId("atlas-dim-nav");
    expect(navBtn).toBeDisabled();
    expect(navBtn).toHaveTextContent("nguồn này không ghi phân khúc");
    expect(navBtn).toHaveAttribute("aria-pressed", "true");
    // Không vẽ chart lệch cho chiều đang khoá — chart cột KHÔNG hiện, thay bằng lời giải thích.
    expect(screen.queryByTestId("signal-columns")).not.toBeInTheDocument();
    expect(screen.getByText(/không ghi được cho lựa chọn điểm đo hiện tại/)).toBeInTheDocument();

    // acq (dims.acq.unit = "kênh"): 6/10 → thiếu 40% → "partial", bấm được, số hiện sẵn trên nút.
    const acqBtn = screen.getByTestId("atlas-dim-acq");
    expect(acqBtn).not.toBeDisabled();
    expect(acqBtn).toHaveTextContent("40% dữ liệu không gán được kênh");

    // Bấm acq (được phép, vì không bị khoá) → giờ mới thấy chart, đúng theo lựa chọn thủ công của người dùng.
    fireEvent.click(acqBtn);
    expect(screen.getByTestId("signal-columns")).toBeInTheDocument();
  });
});
