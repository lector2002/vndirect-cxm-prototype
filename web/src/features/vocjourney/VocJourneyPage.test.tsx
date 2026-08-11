import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault } from "../../data/fixtures/seed.ts";
import { demoData } from "../../data/fixtures/demo.ts";
import { evidenceAtStep, quietButVoicedSteps, voiceCountAtPhase } from "../../domain/index.ts";
import { nf } from "../../design-system/format.ts";
import { VocJourneyPage } from "./VocJourneyPage.tsx";
import { VocTouchpointInspector } from "./VocTouchpointInspector.tsx";

/* Màn dùng store singleton thật, mà singleton là `demoData` (store/store.ts:176) — KHÔNG phải
   `seed`. Mọi kỳ vọng ở đây suy từ `demoData`, không chép số bằng tay: đo nhầm bộ dữ liệu là lỗi đã
   xảy ra một lần trong stream này và nó làm sai cả kết luận lẫn câu hỏi đặt cho owner.

   Hai chỗ được canh kỹ nhất, vì cả hai đều là loại lỗi "màn nói sai về chính nó":
   · Rail phase chỉ mang MỘT đơn vị. Phase "04 Giao dịch" được taxonomy khai 1.900 phản hồi nhưng
     chỉ có 51 bằng chứng gắn tới điểm chạm — con số 1.900 mà lọt lên rail thì rail đang hứa nhiều
     gấp gần bốn mươi lần thứ mở ra đọc được.
   · Danh sách phải CẮT. Bước đông nhất có 175 bằng chứng. */

const PILOT_CODES = ["02", "03"];
const phaseIdOfFlow = (flowId: string) => {
  const f = demoData.flows.find((x) => x.id === flowId)!;
  return demoData.groups.find((g) => g.id === f.groupId)!.phaseId;
};

/** Bước đông bằng chứng nhất TRONG phạm vi pilot — chỗ duy nhất chứng được cái cắt là thật. */
const busiestStep = demoData.steps
  .filter((s) => PILOT_CODES.includes(demoData.phases.find((p) => p.id === phaseIdOfFlow(s.flowId))!.code))
  .map((s) => ({ step: s, n: evidenceAtStep(demoData, s.id).length }))
  .sort((a, b) => b.n - a.n)[0]!;

const busiestFlow = demoData.flows.find((f) => f.id === busiestStep.step.flowId)!;
const busiestPhase = demoData.phases.find((p) => p.id === phaseIdOfFlow(busiestFlow.id))!;

/* "04 Giao dịch" — phase khoá ĐÃ CÓ 1 flow đo được (1/16) và được taxonomy khai nhiều phản hồi
   nhất. Đúng ca hai mẫu số đá nhau, nên lấy đích danh chứ không lấy phase khoá đầu tiên gặp được. */
const lockedPhase = demoData.phases.find((p) => p.code === "04")!;
const lockedTaxNode = demoData.tax.find((t) => t.lv === "L1" && t.maps === lockedPhase.id)!;

/** Mở màn tới đúng bước đông nhất: chọn phase → chọn flow → chọn điểm chạm. */
function openBusiestStep() {
  render(<VocJourneyPage />);
  fireEvent.click(screen.getByTestId(`voc-phase-${busiestPhase.id}`));
  fireEvent.click(screen.getByTestId(`voc-flow-${busiestFlow.id}`));
  fireEvent.click(screen.getByTestId(`voc-step-${busiestStep.step.id}`));
}

describe("VocJourneyPage — rail phase mang MỘT đơn vị", () => {
  it("hiện đủ sáu phase, phase ngoài pilot khoá mờ và bấm được để đọc lý do", () => {
    render(<VocJourneyPage />);
    for (const p of demoData.phases) expect(screen.getByTestId(`voc-phase-${p.id}`)).toBeInTheDocument();

    const locked = screen.getByTestId(`voc-phase-${lockedPhase.id}`);
    expect(locked).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(locked);
    const note = screen.getByTestId("voc-phase-note");
    expect(note).toHaveTextContent("chưa nằm trong phạm vi pilot");
    // Phase 04 đã đo một phần — lý do phải nói đúng thế, không nói bừa "chưa đo gì".
    expect(note).toHaveTextContent("mới 1 trên 16 flow có dữ liệu quan sát");
  });

  it("KHÔNG in số phản hồi của taxonomy lên rail — rail chỉ đếm bằng chứng mẫu", () => {
    render(<VocJourneyPage />);
    const locked = screen.getByTestId(`voc-phase-${lockedPhase.id}`);
    // Taxonomy khai 1.900 cho phase này; đếm thật ra 51. Rail phải mang con số đếm được.
    expect(nf(lockedTaxNode.n)).not.toBe(nf(voiceCountAtPhase(demoData, lockedPhase.id)));
    expect(locked).toHaveTextContent(`${nf(voiceCountAtPhase(demoData, lockedPhase.id))} bằng chứng mẫu`);
    expect(locked).not.toHaveTextContent(nf(lockedTaxNode.n));
  });

  /* Đo 06/08 mới lộ ra: flow "Mở tài khoản phái sinh" nằm ở phase 04 (Giao dịch) chứ không phải
     phase 02 như tên gọi khiến người ta tưởng — nên một phase ĐANG KHOÁ vẫn đang giữ 51 bằng chứng
     mẫu. Rail in số đó lên một ô bấm không vào được, nên lý do khoá phải nói ra cả vế thứ hai. */
  it("phase khoá mà VẪN có tiếng nói thì lý do phải nói ra điều đó, không chỉ nói 'chưa đo'", () => {
    const voice = voiceCountAtPhase(demoData, lockedPhase.id);
    expect(voice).toBeGreaterThan(0);
    render(<VocJourneyPage />);
    fireEvent.click(screen.getByTestId(`voc-phase-${lockedPhase.id}`));
    const note = screen.getByTestId("voc-phase-note");
    expect(note).toHaveTextContent(`đã có ${voice} bằng chứng mẫu gắn tới điểm chạm`);
    expect(note).toHaveTextContent("vẫn nằm ngoài lượt trình bày");
  });

  it("phase khoá và KHÔNG có tiếng nói thì không bịa thêm vế thứ hai", () => {
    const silent = demoData.phases.find(
      (p) => !PILOT_CODES.includes(p.code) && voiceCountAtPhase(demoData, p.id) === 0,
    )!;
    render(<VocJourneyPage />);
    expect(screen.getByTestId(`voc-phase-${silent.id}`)).toHaveTextContent("chưa gắn bằng chứng nào");
    fireEvent.click(screen.getByTestId(`voc-phase-${silent.id}`));
    expect(screen.getByTestId("voc-phase-note")).not.toHaveTextContent("bằng chứng mẫu gắn tới điểm chạm");
  });

  it("phase có bằng chứng thì rail in đúng số đếm được, không phải số taxonomy khai", () => {
    render(<VocJourneyPage />);
    const n = voiceCountAtPhase(demoData, busiestPhase.id);
    expect(n).toBeGreaterThan(0);
    expect(screen.getByTestId(`voc-phase-${busiestPhase.id}`)).toHaveTextContent(`${nf(n)} bằng chứng mẫu`);
  });

  /* Màn tự chọn sẵn một phase khi mới vào (suy từ flow mặc định). Phase đó KHÔNG được là phase
     khoá: khoá nghĩa là màn từ chối mở, mà mới vào đã đứng sẵn bên trong thì màn đang tự cãi mình.
     Hôm nay không xảy ra, nhưng chỉ vì flow "Mở tài khoản phái sinh" (phase 04, khoá, 51 bằng
     chứng) tình cờ đứng sau trong mảng — thứ tự mảng chứ không phải bất biến. Ghim lại ở cả hai
     màn hành trình, vì hai màn dùng biểu thức chọn mặc định KHÁC nhau. */
  it("phase màn tự chọn khi mới vào không bao giờ là phase đang khoá", () => {
    render(<VocJourneyPage />);
    const selected = demoData.phases
      .map((p) => screen.getByTestId(`voc-phase-${p.id}`))
      .filter((el) => el.getAttribute("aria-pressed") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).not.toHaveAttribute("aria-disabled", "true");
  });

  it("câu 'khoảng cách hai mẫu số' là chỗ DUY NHẤT số taxonomy xuất hiện, và nó đứng cạnh số thật", () => {
    render(<VocJourneyPage />);
    fireEvent.click(screen.getByTestId(`voc-phase-${busiestPhase.id}`));
    const line = screen.getByTestId("voc-gap-line");
    expect(line).toHaveTextContent("Taxonomy khai");
    expect(line).toHaveTextContent(String(voiceCountAtPhase(demoData, busiestPhase.id)));
  });
});

describe("VocJourneyPage — chuỗi điểm chạm", () => {
  it("mới vào màn thì CHƯA mở hồ sơ điểm chạm nào; bấm một thẻ mới mở", () => {
    render(<VocJourneyPage />);
    expect(screen.queryByTestId("voc-inspector-tabs")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`voc-step-${busiestStep.step.id}`));
    expect(screen.getByTestId("voc-inspector-tabs")).toBeInTheDocument();
  });

  it("bấm lại đúng thẻ đang mở thì đóng hồ sơ", () => {
    render(<VocJourneyPage />);
    fireEvent.click(screen.getByTestId(`voc-step-${busiestStep.step.id}`));
    fireEvent.click(screen.getByTestId(`voc-step-${busiestStep.step.id}`));
    expect(screen.queryByTestId("voc-inspector-tabs")).not.toBeInTheDocument();
  });

  /* Nội dung thật của màn: chỗ hành vi im lặng mà tiếng nói thì không. Kỳ vọng SUY từ dữ liệu +
     ngưỡng, không ghim mã bước — ghim mã bước là để test xanh trong khi câu chữ đã sai. */
  it("ghi chú đối chiếu hai lớp nói đúng nhánh mà dữ liệu đang ở", () => {
    render(<VocJourneyPage />);
    fireEvent.click(screen.getByTestId(`voc-phase-${busiestPhase.id}`));
    fireEvent.click(screen.getByTestId(`voc-flow-${busiestFlow.id}`));

    const steps = demoData.steps.filter((s) => s.flowId === busiestFlow.id);
    const quiet = quietButVoicedSteps(demoData, cfgDefault, steps);
    const note = screen.getByTestId("voc-two-layer");
    if (quiet.length > 0) {
      expect(note).toHaveTextContent("Hành vi im lặng không có nghĩa là không có vấn đề");
      for (const s of quiet) expect(note).toHaveTextContent(s.name);
    } else {
      expect(note).toHaveTextContent("hai lớp đang nói cùng một điều");
    }
  });
});

describe("VocTouchpointInspector — cắt danh sách theo dữ liệu thật", () => {
  it("bước đông nhất vượt xa 10 bằng chứng nhưng CHỈ hiện 10, phần còn lại đếm ra chữ", () => {
    // Nếu số này tụt xuống ≤10 thì test mất ý nghĩa — canh luôn tiền đề.
    expect(busiestStep.n).toBeGreaterThan(10);
    openBusiestStep();
    fireEvent.click(screen.getByTestId("voc-tab-verb"));

    expect(screen.getByTestId("voc-verbatim-list").children).toHaveLength(10);
    expect(screen.getByTestId("voc-verb-more")).toHaveTextContent(`Xem hết ${nf(busiestStep.n)} verbatim`);
  });

  it("bấm mở thì hiện đủ, và danh sách cuộn trong khung cao cố định chứ không đẩy màn", () => {
    openBusiestStep();
    fireEvent.click(screen.getByTestId("voc-tab-verb"));
    fireEvent.click(screen.getByTestId("voc-verb-more"));

    const list = screen.getByTestId("voc-verbatim-list");
    expect(list.children).toHaveLength(busiestStep.n);
    expect(list.className).toContain("overflow-y-auto");
    expect(screen.getByTestId("voc-verb-more")).toHaveTextContent("Thu gọn");
  });

  it("danh sách topic cũng cắt: hiện tối đa 6, nói rõ đang hiện mấy trên mấy", () => {
    openBusiestStep();
    expect(screen.getByText(/Topic tại điểm chạm này — đang hiện/)).toHaveTextContent(/đang hiện [1-6] trên/);
  });

  it("dải mẫu số nói đúng số bằng chứng của bước, đặt cạnh tổng toàn hệ", () => {
    openBusiestStep();
    // Màn có ba card cùng có dải mẫu số — lấy đúng dải của hồ sơ điểm chạm.
    const strips = screen.getAllByTestId("denom-strip");
    expect(strips.some((s) => s.textContent?.includes(`${nf(busiestStep.n)} trên ${nf(demoData.ev.length)} bằng chứng mẫu toàn hệ`))).toBe(true);
  });
});

/* Điểm chạm RỖNG không tồn tại trong demoData (cả 30 bước đều đã có bằng chứng), nên ba nhánh
   "chưa có gì" không bao giờ chạy nếu chỉ test qua màn. Một fixture đầy đủ tiện tay là cùng cái bẫy
   với một fixture nhỏ tiện tay — nên dựng thẳng ca đó ra ở đây. */
describe("VocTouchpointInspector — ba nghĩa của 'trống', dựng ca rỗng", () => {
  const emptyStep = demoData.steps[0]!;
  const renderEmpty = () =>
    render(
      <VocTouchpointInspector step={emptyStep} evs={[]} ins={[]} data={demoData} evTotal={demoData.ev.length} />,
    );

  it("tab Topic: nói rõ chưa có bằng chứng mẫu (luật 11/08: đã bỏ câu phân biệt 'khách không nói gì')", () => {
    renderEmpty();
    expect(screen.getByText("Chưa có bằng chứng mẫu nào gán vào điểm chạm này.")).toBeInTheDocument();
    expect(screen.queryByText(/khách không nói gì/)).not.toBeInTheDocument();
  });

  it("tab Verbatim: nói chưa có verbatim nào", () => {
    renderEmpty();
    fireEvent.click(screen.getByTestId("voc-tab-verb"));
    expect(screen.getByText(/Chưa có verbatim nào tại điểm chạm này/)).toBeInTheDocument();
  });

  /* luật 11/08 (Dạng A): bỏ đuôi "chưa đo, chứ không phải đo rồi không thấy gì" — giữ nguyên vế
     trạng thái dữ liệu. Canh lại ở vế còn giữ, KHÔNG xoá test. */
  it("tab Insight: KHÔNG bằng chứng nào → nói rõ chưa có insight VÀ chưa có bằng chứng mẫu", () => {
    renderEmpty();
    fireEvent.click(screen.getByTestId("voc-tab-ins"));
    expect(
      screen.getByText(/Chưa có insight nào cho điểm chạm này, và cũng chưa có bằng chứng mẫu nào ở đây/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/chưa đo, chứ không phải đo rồi không thấy gì/)).not.toBeInTheDocument();
  });

  /* luật 11/08 (Dạng A): bỏ đuôi 'không phải "đã xem xét và kết luận không có vấn đề"' — giữ nguyên
     vế trạng thái dữ liệu. Ca này vẫn phải đọc KHÁC hẳn ca trên (test gốc), giờ so bằng chính câu
     còn giữ thay vì câu đã bỏ. */
  it("tab Insight: CÓ bằng chứng nhưng chưa tổng hợp → câu chữ phải khác hẳn ca trên", () => {
    render(
      <VocTouchpointInspector
        step={busiestStep.step}
        evs={evidenceAtStep(demoData, busiestStep.step.id)}
        ins={[]}
        data={demoData}
        evTotal={demoData.ev.length}
      />,
    );
    fireEvent.click(screen.getByTestId("voc-tab-ins"));
    expect(
      screen.getByText(new RegExp(`Chưa có insight nào cho điểm chạm này, dù đã có.*bằng chứng mẫu`)),
    ).toBeInTheDocument();
    expect(screen.queryByText(/và cũng chưa có bằng chứng mẫu nào ở đây/)).not.toBeInTheDocument();
    expect(screen.queryByText(/đã xem xét và kết luận không có vấn đề/)).not.toBeInTheDocument();
  });

  it("bước rỗng: dải mẫu số nói sentiment CHƯA ĐO, không in 0,0", () => {
    renderEmpty();
    const strip = screen.getByTestId("denom-strip");
    expect(strip).toHaveTextContent("sentiment trung bình chưa đo");
    expect(strip).not.toHaveTextContent("0,0");
  });
});
