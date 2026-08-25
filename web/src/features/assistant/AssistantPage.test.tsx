import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { createCxmStore } from "../../store/store.ts";
import { seedAssistantSessions, useAssistantStore } from "../../store/assistant.ts";
import { AssistantPage } from "./AssistantPage.tsx";
import { answerFor, PROMPTS } from "./prompts.ts";

/* Màn Assistant gộp (owner duyệt 25/08). Store phiên chat là SINGLETON như useTimeframeStore —
   reset sau mỗi test để lượt hỏi của test này không rò sang test khác (cùng lý do afterEach của
   OverviewPage.test với range). Số trong câu trả lời KHÔNG ghim — đối chiếu qua chính answerFor
   trên cùng store data (builder đã có bộ test đếm lại riêng ở prompts.test.ts). */

const st = createCxmStore(new MockRepository()).getState();
const { data, cfg } = st;

afterEach(() => {
  useAssistantStore.setState({ sessions: seedAssistantSessions(), activeId: null });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AssistantPage />
    </MemoryRouter>,
  );
}

describe("landing kiểu Enterpret", () => {
  it("câu chào + đủ mọi câu hỏi mẫu của PROMPTS + ô hỏi tự do + disclaimer", () => {
    renderPage();
    expect(screen.getByText("Bạn muốn biết gì về khách hàng?")).toBeInTheDocument();
    for (const p of PROMPTS) {
      expect(screen.getByTestId(`assistant-prompt-${p.id}`)).toHaveTextContent(p.label);
    }
    expect(screen.getByTestId("assistant-input")).toBeInTheDocument();
    expect(screen.getByText(/kiểm tra lại số quan trọng/)).toBeInTheDocument();
    // "Claude ▾" là chữ tĩnh trang trí, KHÔNG phải nút — control câm trông bấm được là lỗi.
    expect(screen.getByText("Claude ▾").tagName).not.toBe("BUTTON");
  });
});

describe("hỏi bằng câu hỏi mẫu", () => {
  it("bấm câu hỏi → hiện 'đang tổng hợp' rồi ra câu trả lời đếm thật + dòng nguồn số chứa asOf", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("assistant-prompt-p-critical"));
    expect(screen.getByTestId("assistant-typing")).toBeInTheDocument();

    const expected = answerFor("p-critical", data, cfg);
    expect(await screen.findByText(expected.intro)).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-typing")).not.toBeInTheDocument();
    const convo = screen.getByTestId("assistant-conversation");
    expect(convo.textContent).toContain(expected.provenance);
    expect(convo.textContent).toContain(data.asOf);
  });

  it("dưới câu trả lời là chip follow-up gồm các câu CHƯA hỏi (tối đa 3), bấm chip là hỏi tiếp", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("assistant-prompt-p-critical"));
    await screen.findByText(answerFor("p-critical", data, cfg).intro);

    expect(screen.queryByTestId("assistant-followup-p-critical")).not.toBeInTheDocument();
    const remaining = PROMPTS.filter((p) => p.id !== "p-critical").slice(0, 3);
    for (const p of remaining) {
      expect(screen.getByTestId(`assistant-followup-${p.id}`)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByTestId(`assistant-followup-${remaining[0]!.id}`));
    expect(await screen.findByText(answerFor(remaining[0]!.id, data, cfg).intro)).toBeInTheDocument();
    expect(screen.getByTestId("assistant-turn-1")).toBeInTheDocument();
  });

  it("câu 'Agent phát hiện gì mới?' trả đủ phát hiện của data.ag — màn Agents & Alerts cũ sống ở đây", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("assistant-prompt-p-agents"));
    const expected = answerFor("p-agents", data, cfg);
    await screen.findByText(expected.intro);
    const convo = screen.getByTestId("assistant-conversation");
    const findings = data.ag.flatMap((g) => g.f);
    expect(findings.length).toBeGreaterThan(0); // tiền đề: seed có phát hiện agent
    for (const f of findings) expect(convo.textContent).toContain(f.title);
  });
});

describe("hỏi tự do", () => {
  it("gõ câu bất kỳ → trả lời trung thực về phạm vi demo, không bịa câu trả lời", async () => {
    renderPage();
    fireEvent.change(screen.getByTestId("assistant-input"), { target: { value: "vì sao trời xanh?" } });
    fireEvent.click(screen.getByTestId("assistant-send"));
    // câu hỏi hiện cả ở bubble lẫn tiêu đề phiên trong lịch sử — chỉ soi phần hội thoại
    const convo = screen.getByTestId("assistant-conversation");
    expect(within(convo).getByText("vì sao trời xanh?")).toBeInTheDocument();
    expect(await within(convo).findByText(/câu hỏi mẫu/)).toBeInTheDocument();
  });
});

describe("lịch sử phiên chat", () => {
  it("phiên mẫu hiện đủ trong panel, nhóm theo asOf (không đồng hồ thật); bấm mở lại đúng hội thoại", () => {
    renderPage();
    const hist = screen.getByTestId("assistant-history");
    for (const s of seedAssistantSessions()) {
      expect(within(hist).getByTestId(`assistant-session-${s.id}`)).toBeInTheDocument();
    }
    // as-seed-1 tạo đúng ngày asOf 27/07/2026 → nhóm "Hôm nay"; hai phiên còn lại trong 7 ngày.
    expect(within(hist).getByText("Hôm nay")).toBeInTheDocument();
    expect(within(hist).getByText("Tuần này")).toBeInTheDocument();

    fireEvent.click(within(hist).getByTestId("assistant-session-as-seed-2"));
    const convo = screen.getByTestId("assistant-conversation");
    // phiên mẫu không lưu câu trả lời — mở lại là DỰNG LẠI từ data hiện tại, đủ 2 lượt của phiên
    expect(within(convo).getByTestId("assistant-turn-1")).toBeInTheDocument();
    expect(convo.textContent).toContain(answerFor("p-sources", data, cfg).intro);
    expect(convo.textContent).toContain(answerFor("p-overdue", data, cfg).intro);
  });

  it("'+ Chat mới' quay về landing; phiên vừa hỏi được thêm vào lịch sử nhóm Hôm nay", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("assistant-prompt-p-sources"));
    await screen.findByText(answerFor("p-sources", data, cfg).intro);

    fireEvent.click(screen.getByTestId("assistant-new"));
    expect(screen.getByTestId("assistant-landing")).toBeInTheDocument();
    const hist = screen.getByTestId("assistant-history");
    const label = PROMPTS.find((p) => p.id === "p-sources")!.label;
    // phiên mới + phiên mẫu as-seed-1 cùng nhóm Hôm nay — tra theo tiêu đề phiên là câu hỏi đầu
    expect(within(hist).getAllByText(label).length).toBeGreaterThan(0);
  });
});
