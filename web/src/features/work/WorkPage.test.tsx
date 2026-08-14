import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, dims, seed } from "../../data/fixtures/seed.ts";
import { PRI_KEYS, PRI_LABEL, isRankable, scoreIssues } from "../../data/priority.ts";
import { getPrimaryAction } from "../../domain/index.ts";
import { navLabel } from "../../nav.tsx";
import { WorkPage } from "./WorkPage.tsx";
import { useCxmStore } from "../../store/store.ts";

/* Container — dùng store singleton thật (useCxmStore) như QuantifyPage.test.tsx. Mọi con số kỳ
   vọng SUY LẠI từ seed thật (KHÔNG chép hằng), để test còn đúng nếu seed đổi.
   Thứ tự test trong file này CÓ Ý NGHĨA: bài kiểm tra advanceAction (mutate singleton) đặt SAU
   CÙNG, để mọi test đọc-only ở trên chạy trên state seed nguyên vẹn. */

/* 02/08/2026 (module-a-charter.md, section A4): chặng đầu đổi 'Gán' (owner===UNASSIGNED) → 'Xác
   nhận' (cf==='pending'); số dẫn của WorkPage đổi trục đếm theo, nên kỳ vọng test cũng phải suy theo
   `cf`/`ap`, không còn theo `owner` nữa (khớp WorkPage.tsx). */
const pendingConfirm = seed.act.filter((a) => a.cf === "pending").length;
const pend = seed.act.filter((a) => a.cf === "confirmed" && a.ap === "pending").length;
const closed = seed.act.filter((a) => a.lc === "closed").length;
const waitLoop = seed.act.filter((a) => a.iv === "validated" && a.lc !== "closed").length;

/* Hai khối, không một danh sách (ADR-002 §19). Điểm gãy đủ 7/7 khoá xuống khối trên và xếp theo
   điểm; còn thiếu khoá thì xuống khối "chưa đủ dữ liệu để xếp", sắp theo SỐ KHOÁ CÒN THIẾU tăng dần.
   Test suy lại bằng chính `scoreIssues`, không ghim id nào: seed hôm nay chưa điền `cfg.step.jc`/`reg`
   và chưa map điểm đo nên khối trên RỖNG — điền vào seed sau này là test tự đi theo. */
const scores = scoreIssues(seed, cfgDefault, dims);
const scoreOf = (id: string) => scores.get(id)!;

const allRows = seed.act
  .filter((a) => a.lc !== "closed")
  .map((a) => ({ action: a, issue: seed.iss.find((i) => i.id === a.iss)! }));

const openRows = allRows
  .filter((r) => isRankable(scoreOf(r.issue.id)))
  .sort((x, y) => scoreOf(y.issue.id).total - scoreOf(x.issue.id).total);

const pendingRows = allRows
  .filter((r) => !isRankable(scoreOf(r.issue.id)))
  .sort((x, y) => scoreOf(x.issue.id).missing.length - scoreOf(y.issue.id).missing.length);

describe("WorkPage — danh sách thanh ngang duy nhất (phương án a)", () => {
  it(`render đúng ${allRows.length} thanh trên cả hai khối, action đã closed không có mặt`, () => {
    render(<WorkPage />);
    const closedAction = seed.act.find((a) => a.lc === "closed")!;
    expect(screen.queryByTestId(`issue-bar-${seed.iss.find((i) => i.act === closedAction.id)!.id}`)).not.toBeInTheDocument();

    const bars = screen.getAllByTestId(/^issue-bar-/);
    expect(bars).toHaveLength(allRows.length);
  });

  it("khối trên xếp giảm dần theo điểm; khối dưới xếp theo số khoá còn thiếu", () => {
    render(<WorkPage />);
    const bars = screen.getAllByTestId(/^issue-bar-/);
    const domIds = bars.map((el) => el.getAttribute("data-testid"));
    const expectedIds = [...openRows, ...pendingRows].map((r) => `issue-bar-${r.issue.id}`);
    expect(domIds).toEqual(expectedIds);
  });

  it("mỗi thanh chưa đủ khoá ghi rõ thiếu khoá nào, khớp missing của scoreIssues", () => {
    render(<WorkPage />);
    for (const r of pendingRows) {
      const line = screen.getByTestId(`work-missing-${r.issue.id}`);
      for (const k of scoreOf(r.issue.id).missing) {
        expect(line.textContent).toContain(PRI_LABEL[k]);
      }
    }
  });

  it("câu điểm ưu tiên trên thanh luôn kèm số khoá đã tính, không bao giờ chỉ con số", () => {
    render(<WorkPage />);
    for (const r of allRows) {
      const s = scoreOf(r.issue.id);
      const bar = screen.getByTestId(`issue-bar-${r.issue.id}`);
      expect(bar.textContent).toContain(
        s.missing.length === 0
          ? `Ưu tiên ${s.total} · đủ ${PRI_KEYS.length}/${PRI_KEYS.length}`
          : `Ưu tiên ${s.total} · thiếu ${s.missing.length}/${PRI_KEYS.length}`,
      );
    }
  });

  /* Hai phép đếm này trước nằm trong câu mở đầu cỡ lớn; owner bỏ khối đó ngày 06/08 và chọn dời
     chúng xuống hàng chip (phương án 1). Test đi theo: cùng hai con số, cùng suy lại từ seed, chỉ
     đổi chỗ đọc. */
  it("hai phép đếm nằm ở hàng chip, khớp nhánh pendingConfirm > 0, suy lại từ seed", () => {
    render(<WorkPage />);
    expect(pendingConfirm).toBeGreaterThan(0);
    expect(screen.getByTestId("chip-load")).toHaveTextContent(`${pendingConfirm} chờ xác nhận`);
    expect(screen.getByTestId("chip-pend")).toHaveTextContent(`${pend} chờ duyệt`);
  });

  it("đầu màn chỉ có tên tab, không còn câu đếm mở đầu", () => {
    const { container } = render(<WorkPage />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(navLabel("work"));
    expect(h1s[0]).not.toHaveTextContent("điểm gãy");
  });

  it(`chip "Đã xong ${closed}" luôn hiện`, () => {
    render(<WorkPage />);
    expect(screen.getByTestId("chip-closed")).toHaveTextContent(`Đã xong ${closed}`);
  });

  it("chip 'chờ khép vòng' KHÔNG hiện khi waitLoop === 0", () => {
    render(<WorkPage />);
    expect(waitLoop).toBe(0);
    expect(screen.queryByTestId("chip-waitloop")).not.toBeInTheDocument();
  });

  it("action bị chặn bởi outcome inconclusive (CXA-017) → nút advance disabled", () => {
    render(<WorkPage />);
    const blockedOutcome = seed.out.find((o) => o.verdict === "inconclusive")!;
    const btn = screen.getByTestId(`advance-${blockedOutcome.act}`);
    expect(btn).toBeDisabled();
  });

  it("màn KHÔNG chứa thẻ <a> nào", () => {
    const { container } = render(<WorkPage />);
    expect(container.querySelectorAll("a").length).toBe(0);
  });

  it("store lộ owners/approvers từ repo (data plumbing)", () => {
    expect(useCxmStore.getState().owners.length).toBe(6);
    expect(useCxmStore.getState().approvers.length).toBe(5);
  });

  // ĐẶT CUỐI CÙNG: mutate singleton store, ảnh hưởng state cho mọi test chạy SAU trong file này.
  it("bấm advance của action KHÔNG bị chặn → state đổi, nút đổi nhãn sang bước kế tiếp", () => {
    render(<WorkPage />);
    const unblocked = allRows.find((r) => seed.out.find((o) => o.act === r.action.id && o.verdict === "inconclusive") === undefined)!;
    const btn = screen.getByTestId(`advance-${unblocked.action.id}`);
    const labelBefore = btn.textContent;
    fireEvent.click(btn);
    const btnAfter = screen.getByTestId(`advance-${unblocked.action.id}`);
    expect(btnAfter.textContent).not.toBe(labelBefore);
  });

  /* --- W3b: các test dưới đây ĐẶT SAU test advance ở trên, và bản thân chúng CŨNG mutate singleton
     (createIssue/confirmIssue) — thứ tự giữa chúng cũng CÓ Ý NGHĨA, ghi rõ trong từng test. State UI
     (createOpen/confirmId/mkerr/mkok/...) là useState CỤC BỘ của component, KHÔNG phải store — mỗi
     render(<WorkPage />) là một instance mới nên không rò rỉ giữa các test; chỉ DATA trong store
     (data.iss/data.act/...) mới cộng dồn qua các test. */

  it("criterion 2: CXI-024 (lane 'confirm', chưa bị test nào đụng) hiện nút 'Xác nhận điểm gãy' + hint đúng; bar khác (CXA-028, lane 'fix') vẫn giữ CTA advance cũ", () => {
    render(<WorkPage />);
    const confirmBtn = screen.getByTestId("assign-CXA-024");
    expect(confirmBtn).toHaveTextContent("Xác nhận điểm gãy");
    expect(screen.getByText("Không duyệt được khi chưa xác nhận điểm gãy")).toBeInTheDocument();
    expect(screen.queryByTestId("advance-CXA-024")).not.toBeInTheDocument();

    const action028 = seed.act.find((a) => a.id === "CXA-028")!;
    const primary028 = getPrimaryAction(action028, seed.out.find((o) => o.act === action028.id), false);
    const bar028 = screen.getByTestId("issue-bar-CXI-028");
    const otherBtn = within(bar028).getByTestId("advance-CXA-028");
    expect(otherBtn).toHaveTextContent(primary028.label);
    expect(within(bar028).getByText(primary028.actor)).toBeInTheDocument();
  });

  it("criterion 4: form Tạo bỏ trống Tiêu đề → banner đỏ TRONG form, form không đóng, KHÔNG tạo record mới", () => {
    render(<WorkPage />);
    const issCountBefore = useCxmStore.getState().data.iss.length;
    fireEvent.click(screen.getByTestId("work-create"));
    expect(screen.getByText("Tạo điểm gãy mới")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tạo điểm gãy"));
    expect(screen.getByText("Cần tiêu đề — một câu nói rõ khách đang gặp gì.")).toBeInTheDocument();
    // Form vẫn còn mở (chưa bị đóng bởi catch-path).
    expect(screen.getByText("Tạo điểm gãy mới")).toBeInTheDocument();
    expect(screen.queryByTestId("banner-mkok")).not.toBeInTheDocument();
    expect(useCxmStore.getState().data.iss.length).toBe(issCountBefore);
  });

  it("criterion 5: xác nhận CXA-024 (chỉ chạy SAU test criterion-2, TRƯỚC mọi test khác đụng CXA-024) → banner-asok, bar chuyển stage-approve current, CTA đổi lại 'Duyệt đề xuất xử lý'", () => {
    render(<WorkPage />);
    const owners = useCxmStore.getState().owners;
    // Trước khi xác nhận: bar CXI-024 còn ở nhánh CTA "Xác nhận điểm gãy" (testid assign-, KHÔNG phải advance-).
    expect(screen.getByTestId("assign-CXA-024")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("assign-CXA-024"));
    fireEvent.change(screen.getByLabelText("Người xử lý"), { target: { value: owners[0] } });
    fireEvent.click(screen.getByTestId("confirm-submit"));

    expect(screen.getByTestId("banner-asok")).toHaveTextContent(`Đã xác nhận CXA-024 (phụ trách: ${owners[0]}), điểm gãy đã chuyển sang chặng Duyệt.`);
    const bar = screen.getByTestId("issue-bar-CXI-024");
    expect(within(bar).getByTestId("stage-approve")).toHaveAttribute("aria-current", "step");
    // Sau khi xác nhận: CTA ĐÃ ĐỔI LẠI sang nhánh advance- (testid assign- không còn) — đây mới là
    // điều criterion 5 thật sự kiểm chứng, chứ không phải nhãn nút (nhãn "Duyệt đề xuất xử lý" giữ
    // nguyên xuyên suốt vì confirmIssue không đổi action.ap, getPrimaryAction vẫn trả về đúng nhánh
    // 'approve' như trước khi xác nhận — điểm khác biệt thật nằm ở việc IssueBar còn hiển thị nhánh
    // assign- hay không, tức laneOf(action) đã rời 'confirm' sang 'approve' — bar THẬT SỰ chuyển làn).
    expect(screen.queryByTestId("assign-CXA-024")).not.toBeInTheDocument();
    const btn = within(bar).getByTestId("advance-CXA-024");
    expect(btn).toHaveTextContent("Duyệt đề xuất xử lý");
    expect(useCxmStore.getState().validate()).toEqual([]);
  });

  it("criterion 6: tạo issue mới (owner để trống) rồi mở form xác nhận, KHÔNG chọn người xử lý → banner đỏ trong form, form còn mở, action KHÔNG đổi owner", () => {
    render(<WorkPage />);
    fireEvent.click(screen.getByTestId("work-create"));
    fireEvent.change(screen.getByLabelText("Tiêu đề — một câu nói rõ khách đang gặp gì"), {
      target: { value: "Test criterion 6 — issue tạm để kiểm tra xác nhận rỗng" },
    });
    fireEvent.click(screen.getByText("Tạo điểm gãy"));
    const newIssue = useCxmStore.getState().data.iss.at(-1)!;
    const newAction = useCxmStore.getState().data.act.find((a) => a.iss === newIssue.id)!;
    expect(newAction.owner).toBe("Chưa gán");

    fireEvent.click(screen.getByTestId(`assign-${newAction.id}`));
    fireEvent.click(screen.getByTestId("confirm-submit"));
    expect(screen.getByText("Chọn một người xử lý. Đây là chỗ duy nhất biến điểm gãy thành việc của ai đó.")).toBeInTheDocument();
    expect(screen.getByText(`Xác nhận điểm gãy · ${newIssue.id}`)).toBeInTheDocument();
    expect(useCxmStore.getState().data.act.find((a) => a.id === newAction.id)!.owner).toBe("Chưa gán");
  });

  it("criterion 3+7+8+9+10: tạo issue (hạn dd chuyển đúng định dạng) → banner-mkok đúng chặng 'Xác nhận', hero/chip tăng đúng, validateFixture()===[] → mở form xác nhận CHÍNH bar vừa tạo → banner-mkok BIẾN MẤT, chưa có banner-asok → xác nhận xong → banner-asok đúng, banner-mkok vẫn vắng, validateFixture()===[]", () => {
    render(<WorkPage />);
    const before = useCxmStore.getState().data;
    const pendingConfirmBefore = before.act.filter((a) => a.cf === "pending").length;

    fireEvent.click(screen.getByTestId("work-create"));
    fireEvent.change(screen.getByLabelText("Tiêu đề — một câu nói rõ khách đang gặp gì"), {
      target: { value: "Test criterion 3/7/8/9/10 — tạo rồi xác nhận" },
    });
    fireEvent.change(screen.getByLabelText("Hạn xử lý"), { target: { value: "2026-09-20" } });
    fireEvent.click(screen.getByText("Tạo điểm gãy"));

    const newIssue = useCxmStore.getState().data.iss.at(-1)!;
    const newAction = useCxmStore.getState().data.act.find((a) => a.iss === newIssue.id)!;
    // owner để trống -> createIssue tự đặt UNASSIGNED, cf luôn 'pending' lúc tạo -> stage 'Xác nhận'
    // (đọc từ ACTION TRẢ VỀ, không đọc từ giá trị form thô).
    expect(newAction.owner).toBe("Chưa gán");
    expect(newAction.cf).toBe("pending");
    expect(newAction.due).toBe("20/09/2026");
    expect(screen.getByTestId("banner-mkok")).toHaveTextContent(`Đã tạo ${newIssue.id}.`);
    expect(screen.getByTestId("banner-mkok")).toHaveTextContent("chặng Xác nhận");
    expect(screen.queryByTestId("banner-asok")).not.toBeInTheDocument();

    // criterion 8: pendingConfirm +1, hàng chip cập nhật đúng (suy lại từ store SAU khi tạo, không
    // phải từ seed tĩnh — vì test advance ở đầu file đã đổi state trước đó), bar mới đúng hạn
    // dd/MM/yyyy. Hai chip đếm này trước là một câu mở đầu; owner dời xuống hàng chip 06/08.
    const afterCreate = useCxmStore.getState().data;
    const pendingConfirmAfter = afterCreate.act.filter((a) => a.cf === "pending").length;
    expect(pendingConfirmAfter).toBe(pendingConfirmBefore + 1);
    const pendAfter = afterCreate.act.filter((a) => a.cf === "confirmed" && a.ap === "pending").length;
    expect(screen.getByTestId("chip-load")).toHaveTextContent(`${pendingConfirmAfter} chờ xác nhận`);
    expect(screen.getByTestId("chip-pend")).toHaveTextContent(`${pendAfter} chờ duyệt`);
    const closedAfter = afterCreate.act.filter((a) => a.lc === "closed").length;
    expect(screen.getByTestId("chip-closed")).toHaveTextContent(`Đã xong ${closedAfter}`);
    const newBar = screen.getByTestId(`issue-bar-${newIssue.id}`);
    expect(newBar).toHaveTextContent("hạn 20/09/2026");

    // criterion 7: validateFixture() rỗng ngay sau createIssue.
    expect(useCxmStore.getState().validate()).toEqual([]);

    // criterion 9: mở form xác nhận TRÊN CHÍNH bar vừa tạo → banner-mkok phải biến mất (xem lý giải
    // lệch khỏi 4 dòng state literal của Việc 4 tại openConfirm() trong WorkPage.tsx), chưa có
    // banner-asok.
    fireEvent.click(within(newBar).getByTestId(`assign-${newAction.id}`));
    expect(screen.queryByTestId("banner-mkok")).not.toBeInTheDocument();
    expect(screen.queryByTestId("banner-asok")).not.toBeInTheDocument();

    const owners = useCxmStore.getState().owners;
    fireEvent.change(screen.getByLabelText("Người xử lý"), { target: { value: owners[1] } });
    fireEvent.change(screen.getByLabelText("Hạn xử lý"), { target: { value: "2026-10-01" } });
    fireEvent.click(screen.getByTestId("confirm-submit"));

    expect(screen.getByTestId("banner-asok")).toHaveTextContent(`Đã xác nhận ${newAction.id} (phụ trách: ${owners[1]}), điểm gãy đã chuyển sang chặng Duyệt.`);
    expect(screen.queryByTestId("banner-mkok")).not.toBeInTheDocument();
    expect(useCxmStore.getState().data.act.find((a) => a.id === newAction.id)!.due).toBe("01/10/2026");
    expect(useCxmStore.getState().data.act.find((a) => a.id === newAction.id)!.cf).toBe("confirmed");

    // criterion 7 (vế thứ hai): validateFixture() vẫn rỗng sau confirmIssue trên record vừa tạo.
    expect(useCxmStore.getState().validate()).toEqual([]);
  });
});
