import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { seed } from "../../data/fixtures/seed.ts";
import { PRI_KEYS, PRI_LABEL, isRankable, scoreIssues } from "../../data/priority.ts";
import { isoFromVn } from "../../data/projectSigTrend.ts";
import { SEV_LABEL } from "./WorkCreateForm.tsx";
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
   Test suy lại bằng chính `scoreIssues`, không ghim id nào — và tính trên ĐÚNG (data, cfg, dims) mà
   singleton đang render (25/08: singleton mang demoCfg điền sẵn jc/reg, khác cfgDefault; oracle
   ghim cfgDefault là lệch trang ngay). */
const st = useCxmStore.getState();
const scores = scoreIssues(st.data, st.cfg, st.dims);
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

/* 25/08: WorkPage gọi useNavigate (mở hồ sơ #/issue/:id từ tiêu đề thanh + link ở dòng chặn) nên
   phải render trong Router — wrapper là đường ngắn nhất, không đổi chữ ký render ở từng test. */
const renderPage = () => render(<WorkPage />, { wrapper: MemoryRouter });

describe("WorkPage — danh sách thanh ngang duy nhất (phương án a)", () => {
  it(`render đúng ${allRows.length} thanh trên cả hai khối, action đã closed không có mặt`, () => {
    renderPage();
    const closedAction = seed.act.find((a) => a.lc === "closed")!;
    expect(screen.queryByTestId(`issue-bar-${seed.iss.find((i) => i.act === closedAction.id)!.id}`)).not.toBeInTheDocument();

    const bars = screen.getAllByTestId(/^issue-bar-/);
    expect(bars).toHaveLength(allRows.length);
  });

  it("khối trên xếp giảm dần theo điểm; khối dưới xếp theo số khoá còn thiếu", () => {
    renderPage();
    const bars = screen.getAllByTestId(/^issue-bar-/);
    const domIds = bars.map((el) => el.getAttribute("data-testid"));
    const expectedIds = [...openRows, ...pendingRows].map((r) => `issue-bar-${r.issue.id}`);
    expect(domIds).toEqual(expectedIds);
  });

  /* 25/08 (owner, brainstorm redesign — phương án A): dòng "Thiếu: ..." lặp dưới mỗi thanh thành
     chip bấm xoè TRONG thanh — test bấm toggle rồi mới soi danh sách. */
  it("mỗi thanh chưa đủ khoá: bấm chip mới xoè danh sách khoá thiếu, khớp missing của scoreIssues", () => {
    renderPage();
    for (const r of pendingRows) {
      expect(screen.queryByTestId(`work-missing-${r.issue.id}`)).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId(`missing-toggle-${r.issue.id}`));
      const line = screen.getByTestId(`work-missing-${r.issue.id}`);
      for (const k of scoreOf(r.issue.id).missing) {
        expect(line.textContent).toContain(PRI_LABEL[k]);
      }
    }
  });

  /* 25/08 (owner): thanh thiếu khoá KHÔNG in số tổng nữa — điểm thấp GIẢ (§19). Số chỉ hiện khi đủ
     7/7; thanh thiếu chỉ nói "thiếu N/7 khoá". Vẫn không bao giờ có con số trần trụi (§9). */
  it("thanh đủ khoá in 'Ưu tiên X · đủ 7/7'; thanh thiếu chỉ in 'Thiếu N/7 khoá', KHÔNG kèm số tổng", () => {
    renderPage();
    for (const r of allRows) {
      const s = scoreOf(r.issue.id);
      const bar = screen.getByTestId(`issue-bar-${r.issue.id}`);
      if (s.missing.length === 0) {
        expect(bar.textContent).toContain(`Ưu tiên ${s.total} · đủ ${PRI_KEYS.length}/${PRI_KEYS.length}`);
      } else {
        expect(bar.textContent).toContain(`Thiếu ${s.missing.length}/${PRI_KEYS.length} khoá`);
        expect(bar.textContent).not.toContain(`Ưu tiên ${s.total}`);
      }
    }
  });

  /* Hai phép đếm này trước nằm trong câu mở đầu cỡ lớn; owner bỏ khối đó ngày 06/08 và chọn dời
     chúng xuống hàng chip (phương án 1). Test đi theo: cùng hai con số, cùng suy lại từ seed, chỉ
     đổi chỗ đọc. */
  it("hai phép đếm nằm ở hàng chip, khớp nhánh pendingConfirm > 0, suy lại từ seed", () => {
    renderPage();
    expect(pendingConfirm).toBeGreaterThan(0);
    expect(screen.getByTestId("chip-load")).toHaveTextContent(`${pendingConfirm} chờ xác nhận`);
    expect(screen.getByTestId("chip-pend")).toHaveTextContent(`${pend} chờ duyệt`);
  });

  it("đầu màn chỉ có tên tab, không còn câu đếm mở đầu", () => {
    const { container } = renderPage();
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(navLabel("work"));
    expect(h1s[0]).not.toHaveTextContent("điểm gãy");
  });

  it(`chip "Đã xong ${closed}" luôn hiện`, () => {
    renderPage();
    expect(screen.getByTestId("chip-closed")).toHaveTextContent(`Đã xong ${closed}`);
  });

  /* ==== 25/08 đợt 2 (owner duyệt cả 4 mục validate đọc-hiểu) — mọi kỳ vọng suy lại từ data ==== */

  it("cụm phải mang nhãn 'xử lý:/duyệt:'; due trước asOf in '⚠ quá hạn', còn hạn in 'hạn' thường", () => {
    renderPage();
    const asOfIso = isoFromVn(st.data.asOf)!;
    for (const r of allRows) {
      const bar = screen.getByTestId(`issue-bar-${r.issue.id}`);
      expect(bar.textContent).toContain(`xử lý: ${r.action.owner} · duyệt: ${r.action.acc}`);
      if (isoFromVn(r.action.due)! < asOfIso) {
        expect(bar.textContent).toContain(`⚠ quá hạn ${r.action.due}`);
      } else {
        expect(bar.textContent).toContain(`hạn ${r.action.due}`);
        expect(bar.textContent).not.toContain(`quá hạn ${r.action.due}`);
      }
    }
    /* Seed phải có CẢ hai trạng thái — không thì vòng trên chỉ đi một nhánh mà vẫn xanh. */
    const overdueCount = allRows.filter((r) => isoFromVn(r.action.due)! < asOfIso).length;
    expect(overdueCount).toBeGreaterThan(0);
    expect(overdueCount).toBeLessThan(allRows.length);
  });

  it("chấm mức độ hết là màu trần: mang aria-label 'Mức nghiêm trọng: ...' đúng SEV_LABEL", () => {
    renderPage();
    for (const r of allRows) {
      const bar = screen.getByTestId(`issue-bar-${r.issue.id}`);
      within(bar).getByRole("img", { name: `Mức nghiêm trọng: ${SEV_LABEL[r.issue.sev]}` });
    }
  });

  it("banner khối-trên-rỗng chỉ còn MỘT câu — vế 'Danh sách bên dưới...' trùng header + chip đã cắt", () => {
    renderPage();
    const note = screen.getByTestId("work-none-rankable");
    expect(note.textContent).toContain(`Chưa điểm gãy nào đủ ${PRI_KEYS.length}/${PRI_KEYS.length} khoá để xếp hạng.`);
    expect(note.textContent).not.toContain("Danh sách bên dưới");
  });

  it("chip 'Đã xong' bấm xoè danh sách việc đã khép vòng, bấm lại thu về", () => {
    renderPage();
    const closedActs = st.data.act.filter((a) => a.lc === "closed");
    expect(closedActs.length).toBeGreaterThan(0);
    expect(screen.queryByTestId("work-closed")).not.toBeInTheDocument();
    const chip = screen.getByTestId("chip-closed");
    expect(chip).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(chip);
    const sec = screen.getByTestId("work-closed");
    for (const a of closedActs) {
      const row = within(sec).getByTestId(`closed-row-${a.id}`);
      expect(row.textContent).toContain(st.data.iss.find((i) => i.id === a.iss)!.title);
    }
    fireEvent.click(screen.getByTestId("chip-closed"));
    expect(screen.queryByTestId("work-closed")).not.toBeInTheDocument();
  });

  it("chip 'chờ khép vòng' KHÔNG hiện khi waitLoop === 0", () => {
    renderPage();
    expect(waitLoop).toBe(0);
    expect(screen.queryByTestId("chip-waitloop")).not.toBeInTheDocument();
  });

  it("action bị chặn bởi outcome inconclusive (CXA-017) → nút advance disabled, dòng chặn kèm link mở hồ sơ", () => {
    renderPage();
    const blockedOutcome = seed.out.find((o) => o.verdict === "inconclusive")!;
    const btn = screen.getByTestId(`advance-${blockedOutcome.act}`);
    expect(btn).toBeDisabled();
    /* 25/08: màn #/issue/:id đã dựng — dòng lý do chặn kèm nút mở hồ sơ đọc yếu tố nhiễu
       (khôi phục đích đến của prototype ở tầng UI; repo.advanceAction vẫn no-op). */
    const blockedIssue = seed.iss.find((i) => i.act === blockedOutcome.act)!;
    expect(screen.getByTestId(`blocked-open-${blockedIssue.id}`)).toHaveTextContent("Mở hồ sơ điểm gãy");
  });

  it("màn KHÔNG chứa thẻ <a> nào", () => {
    const { container } = renderPage();
    expect(container.querySelectorAll("a").length).toBe(0);
  });

  it("store lộ owners/approvers từ repo (data plumbing)", () => {
    expect(useCxmStore.getState().owners.length).toBe(6);
    expect(useCxmStore.getState().approvers.length).toBe(5);
  });

  // ĐẶT CUỐI CÙNG: mutate singleton store, ảnh hưởng state cho mọi test chạy SAU trong file này.
  it("bấm advance của action KHÔNG bị chặn → state đổi, nút đổi nhãn sang bước kế tiếp", () => {
    renderPage();
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
     renderPage() là một instance mới nên không rò rỉ giữa các test; chỉ DATA trong store
     (data.iss/data.act/...) mới cộng dồn qua các test. */

  it("criterion 2: CXI-024 (lane 'confirm', chưa bị test nào đụng) hiện nút 'Xác nhận điểm gãy' + hint đúng; bar khác (CXA-028, lane 'fix') vẫn giữ CTA advance cũ", () => {
    renderPage();
    const confirmBtn = screen.getByTestId("assign-CXA-024");
    expect(confirmBtn).toHaveTextContent("Xác nhận điểm gãy");
    // 25/08 (phương án A): hint rời dòng explain dưới nút vào title của chính nút.
    expect(confirmBtn).toHaveAttribute("title", "Không duyệt được khi chưa xác nhận điểm gãy");
    expect(screen.queryByTestId("advance-CXA-024")).not.toBeInTheDocument();

    const action028 = seed.act.find((a) => a.id === "CXA-028")!;
    const primary028 = getPrimaryAction(action028, seed.out.find((o) => o.act === action028.id), false);
    const bar028 = screen.getByTestId("issue-bar-CXI-028");
    const otherBtn = within(bar028).getByTestId("advance-CXA-028");
    expect(otherBtn).toHaveTextContent(primary028.label);
    expect(otherBtn).toHaveAttribute("title", primary028.actor);
  });

  it("criterion 4: form Tạo bỏ trống Tiêu đề → banner đỏ TRONG form, form không đóng, KHÔNG tạo record mới", () => {
    renderPage();
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
    renderPage();
    const owners = useCxmStore.getState().owners;
    // Trước khi xác nhận: bar CXI-024 còn ở nhánh CTA "Xác nhận điểm gãy" (testid assign-, KHÔNG phải advance-).
    expect(screen.getByTestId("assign-CXA-024")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("assign-CXA-024"));
    fireEvent.change(screen.getByLabelText("Người xử lý"), { target: { value: owners[0] } });
    fireEvent.click(screen.getByTestId("confirm-submit"));

    expect(screen.getByTestId("banner-asok")).toHaveTextContent(`Đã xác nhận CXA-024 (phụ trách: ${owners[0]}), điểm gãy đã chuyển sang chặng Duyệt.`);
    const bar = screen.getByTestId("issue-bar-CXI-024");
    // 25/08 (phương án A): dải 4 ô thành chip tên chặng — bar chuyển làn đọc ra ở chữ trong chip.
    const chip = within(bar).getByTestId("stage-chip");
    expect(chip).toHaveTextContent("Duyệt · 2/4");
    expect(chip).toHaveAttribute("aria-current", "step");
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
    renderPage();
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
    renderPage();
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
