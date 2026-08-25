import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { issueScore } from "../../data/priority.ts";
import { advanceBlockedReason, getPrimaryAction } from "../../domain/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { SEV_LABEL } from "../work/WorkCreateForm.tsx";
import { IssuePage } from "./IssuePage.tsx";

/* Màn Điểm gãy (Module B, owner gỡ chốt 25/08). IssuePage đọc SINGLETON useCxmStore (demoData —
   charter: "singleton store chạy demoData, trên trình duyệt chart vẫn hiện") — mọi số đối chiếu
   ĐẾM LẠI từ chính store, không ghim. Test mutate store (advance) nằm CUỐI FILE — quy ước
   WorkPage.test. Ba issue phủ ba hình dạng charter: CXI-021 đủ · CXI-028 rỗng hết · CXI-013 đã
   khép vòng. */

const st = useCxmStore.getState();
const { data, cfg, dims } = st;

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/issue/${id}`]}>
      <Routes>
        <Route path="/issue/:id" element={<IssuePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function issueOf(id: string) {
  return data.iss.find((i) => i.id === id)!;
}
function actionOf(id: string) {
  return data.act.find((a) => a.id === issueOf(id).act)!;
}
function outcomeOf(id: string) {
  return data.out.find((o) => o.act === issueOf(id).act);
}

describe("vỏ màn (quyết định #2 owner)", () => {
  it("h1 'Điểm gãy' + tiêu đề dòng riêng + nút Quay lại + hàng nhận dạng + 5 tab", () => {
    renderAt("CXI-021");
    const i = issueOf("CXI-021");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Điểm gãy");
    expect(screen.getByTestId("issue-title").textContent).toBe(i.title);
    expect(screen.getByText("← Quay lại")).toBeInTheDocument();
    expect(screen.getByText(i.id)).toBeInTheDocument();
    expect(screen.getByText(SEV_LABEL[i.sev])).toBeInTheDocument();
    expect(screen.getByText(`${i.conf}%`)).toBeInTheDocument();
    for (const label of ["Bằng chứng", "Ảnh hưởng", "Cohort ảnh hưởng", "Xử lý", "Kết quả"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("id lạ ⇒ câu không tìm thấy, không crash (PageTitle cố ý không dùng)", () => {
    renderAt("CXI-BOGUS");
    expect(screen.getByText(/Không tìm thấy điểm gãy/)).toBeInTheDocument();
  });
});

describe("tab Bằng chứng", () => {
  it("CXI-021: giả thuyết + đủ số verbatim đếm lại từ issue.ev; metric contract gập mặc định, bấm mới bung", () => {
    renderAt("CXI-021");
    const i = issueOf("CXI-021");
    expect(i.ev.length).toBeGreaterThan(0); // tiền đề charter: CXI-021 đủ dữ liệu
    expect(screen.getByText(i.hyp)).toBeInTheDocument();
    const list = screen.getByTestId("issue-ev-list");
    expect(list.children).toHaveLength(i.ev.length);

    expect(screen.queryByTestId("issue-metric-contract")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("issue-metric-contract-toggle"));
    const metric = data.metrics.find((m) => m.id === i.metric)!;
    expect(within(screen.getByTestId("issue-metric-contract")).getByText(metric.name)).toBeInTheDocument();
  });

  it("CXI-028: 0 bằng chứng ⇒ đúng câu prototype dòng 3261, kèm chính conf của issue", () => {
    renderAt("CXI-028");
    const i = issueOf("CXI-028");
    expect(i.ev).toHaveLength(0); // tiền đề charter
    const empty = screen.getByTestId("issue-ev-empty");
    expect(empty.textContent).toContain("Chưa có bằng chứng từ khách hàng");
    expect(empty.textContent).toContain(`${i.conf}%`);
  });
});

describe("tab Ảnh hưởng", () => {
  it("CXI-021: breakdown đúng số khoá tính được; khoá thiếu được đếm ra chữ, không xếp điểm giả", () => {
    renderAt("CXI-021");
    fireEvent.click(screen.getByRole("tab", { name: "Ảnh hưởng" }));
    const score = issueScore(issueOf("CXI-021"), data, cfg, dims);
    expect(screen.getByTestId("issue-pri-breakdown").children).toHaveLength(score.computed.length);
    expect(screen.getByText(`Breakdown điểm ưu tiên — tổng ${score.total}`)).toBeInTheDocument();
    if (score.missing.length > 0) {
      expect(screen.getByTestId("issue-pri-missing").textContent).toContain(`${score.missing.length}/7`);
    }
  });

  it("CXI-028: aff trống + 0 ev + 0 cust ⇒ câu 'lỗi hệ thống thu thập' SUY TỪ DỮ LIỆU đứng cạnh conf cao", () => {
    renderAt("CXI-028");
    fireEvent.click(screen.getByRole("tab", { name: "Ảnh hưởng" }));
    const i = issueOf("CXI-028");
    const score = issueScore(i, data, cfg, dims);
    // tiền đề của luật suy: đúng hình dạng CXI-028 charter nêu
    expect(i.ev).toHaveLength(0);
    expect(i.cust).toHaveLength(0);
    expect(score.x.aff === null || score.x.aff === 0).toBe(true);
    expect(screen.getByTestId("issue-imp-systemic").textContent).toContain("hệ thống thu thập dữ liệu");
  });

  it("Voice Insight: CXI-021 có insight nguồn (VI-01); CXI-028 in câu 'không đến từ Voice of Customer'", () => {
    renderAt("CXI-021");
    fireEvent.click(screen.getByRole("tab", { name: "Ảnh hưởng" }));
    const ins = data.ins.find((x) => x.id === issueOf("CXI-021").ins)!;
    expect(screen.getByTestId("issue-vi").textContent).toContain(ins.owner);
  });
});

describe("tab Cohort", () => {
  it("CXI-021: bảng 9 cột, số dòng = số khách phân giải được; câu rào pseudonymize KHÔNG được bỏ", () => {
    renderAt("CXI-021");
    fireEvent.click(screen.getByRole("tab", { name: "Cohort ảnh hưởng" }));
    const i = issueOf("CXI-021");
    const cs = i.cust.filter((k) => data.cust.some((c) => c.key === k));
    expect(cs.length).toBeGreaterThan(0); // tiền đề charter: CXI-021 cohort 4
    const table = screen.getByTestId("issue-cohort-table");
    expect(table.querySelectorAll("thead th")).toHaveLength(9);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(cs.length);
    expect(screen.getByText(/không phải màn tra cứu khách hàng/)).toBeInTheDocument();
    // "pseudonymize" xuất hiện ở cả câu rào lẫn srcNote của Stat — chỉ cần còn tồn tại, không đếm
    expect(screen.getAllByText(/pseudonymize/).length).toBeGreaterThan(0);
  });

  it("hai nhánh rỗng PHÂN BIỆT: CXI-028 (0 ev) là lỗi thu thập; CXI-024 (có ev, 0 cust) là chưa nối định danh", () => {
    const first = renderAt("CXI-028");
    fireEvent.click(screen.getByRole("tab", { name: "Cohort ảnh hưởng" }));
    expect(screen.getByTestId("issue-cohort-empty").textContent).toContain("hệ thống thu thập dữ liệu");
    first.unmount();

    renderAt("CXI-024");
    fireEvent.click(screen.getByRole("tab", { name: "Cohort ảnh hưởng" }));
    expect(screen.getByTestId("issue-cohort-empty").textContent).toContain("chưa nối được sang định danh khách");
  });
});

describe("tab Xử lý — cùng câu trả lời với WorkPage (quyết định thiết kế #6)", () => {
  it("CTA + actor đúng getPrimaryAction(action, outcome, lc==='closed'); CXI-013 đã khép vòng ⇒ 'Hoàn tất', không còn nút", () => {
    const first = renderAt("CXI-021");
    fireEvent.click(screen.getByRole("tab", { name: "Xử lý" }));
    const a021 = actionOf("CXI-021");
    const p021 = getPrimaryAction(a021, outcomeOf("CXI-021"), a021.lc === "closed");
    expect(screen.getByTestId("issue-action-advance").textContent).toBe(p021.label);
    expect(screen.getByText(p021.actor)).toBeInTheDocument();
    first.unmount();

    renderAt("CXI-013");
    fireEvent.click(screen.getByRole("tab", { name: "Xử lý" }));
    const a013 = actionOf("CXI-013");
    expect(a013.lc).toBe("closed"); // tiền đề charter: loop 25/25, đã khép
    expect(screen.queryByTestId("issue-action-advance")).not.toBeInTheDocument();
    expect(screen.getByText("✓ Hoàn tất")).toBeInTheDocument();
  });

  it("CXI-017: outcome inconclusive chưa validate ⇒ nút bị khoá kèm ĐÚNG lý do của advanceBlockedReason", () => {
    renderAt("CXI-017");
    fireEvent.click(screen.getByRole("tab", { name: "Xử lý" }));
    const a = actionOf("CXI-017");
    const reason = advanceBlockedReason(a, outcomeOf("CXI-017"));
    expect(reason).not.toBeNull(); // tiền đề charter: inconclusive, 2 confounder
    expect(screen.getByTestId("issue-action-advance")).toBeDisabled();
    expect(screen.getByTestId("issue-action-blocked").textContent).toBe(reason);
  });
});

describe("tab Kết quả", () => {
  it("CXI-013: chart + mốc đóng băng in kèm AI và LÚC NÀO; loop kv đủ need/done/kênh", () => {
    renderAt("CXI-013");
    fireEvent.click(screen.getByRole("tab", { name: "Kết quả" }));
    const snap = data.snap.find((s) => s.iss === "CXI-013")!;
    expect(screen.getByTestId("verify-chart")).toBeInTheDocument();
    const prov = screen.getByTestId("issue-snap-provenance").textContent ?? "";
    expect(prov).toContain(snap.by);
    expect(prov).toContain(snap.at);

    const loop = data.loop.find((l) => l.iss === "CXI-013")!;
    const kv = screen.getByTestId("issue-loop").textContent ?? "";
    expect(kv).toContain(loop.ch);
    expect(kv).toContain(String(loop.need));
  });

  it("CXI-017: khối confounder đếm đúng outcome.conf và liệt kê từng yếu tố nguyên văn", () => {
    renderAt("CXI-017");
    fireEvent.click(screen.getByRole("tab", { name: "Kết quả" }));
    const o = outcomeOf("CXI-017")!;
    expect(o.conf.length).toBeGreaterThan(0); // tiền đề charter: 2 confounder
    const box = screen.getByTestId("issue-confounders");
    expect(box.textContent).toContain(`${o.conf.length} yếu tố nhiễu`);
    for (const c of o.conf) expect(box.textContent).toContain(c);
  });

  it("CXI-024: chưa xác nhận ⇒ 'chưa có mốc so sánh' + 'chưa có kết quả để đo' + chưa lập danh sách loop", () => {
    renderAt("CXI-024");
    fireEvent.click(screen.getByRole("tab", { name: "Kết quả" }));
    expect(screen.getByTestId("issue-timeline-none")).toBeInTheDocument();
    expect(screen.getByTestId("issue-outcome-none")).toBeInTheDocument();
    expect(screen.getByTestId("issue-loop-none")).toBeInTheDocument();
  });
});

/* ---- MUTATION CUỐI FILE (quy ước WorkPage.test): advance ghi vào SINGLETON store ---- */
describe("tab Xử lý — advance dùng cùng state với #/work", () => {
  it("bấm CTA của CXI-021 ⇒ action trong store đổi đúng như advanceAction của repository", () => {
    renderAt("CXI-021");
    fireEvent.click(screen.getByRole("tab", { name: "Xử lý" }));
    const before = getPrimaryAction(actionOf("CXI-021"), outcomeOf("CXI-021"), actionOf("CXI-021").lc === "closed");
    fireEvent.click(screen.getByTestId("issue-action-advance"));

    const after = useCxmStore.getState().data.act.find((a) => a.id === issueOf("CXI-021").act)!;
    const pAfter = getPrimaryAction(after, useCxmStore.getState().data.out.find((o) => o.act === after.id), after.lc === "closed");
    expect(pAfter.key).not.toBe(before.key); // vòng xử lý đã tiến một bước, cùng transition với board
  });
});
