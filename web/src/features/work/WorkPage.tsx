import { useState } from "react";
import type { Issue } from "../../data/schema/index.ts";
import type { ConfirmFields, CreateIssueFields } from "../../data/repository.ts";
import { advanceBlockedReason, getPrimaryAction, laneOf } from "../../domain/index.ts";
import { IssueBar, Note, btnPrimary, btnSecondary, btnSizeLg, btnSizeSm } from "../../design-system/index.ts";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { WorkCreateForm } from "./WorkCreateForm.tsx";
import { WorkConfirmForm } from "./WorkConfirmForm.tsx";

/* Banner "vừa tạo/vừa xác nhận" — port ST.sel.mkok/ST.sel.asok (prototype ~dòng 4636-4684); TÊN BIẾN
   giữ nguyên gốc mkok/asok dù chặng đã đổi 'Gán'→'Xác nhận' (owner chốt 02/08/2026,
   module-a-charter.md, section A4) — không phải vocabulary hiển thị, chỉ là định danh nội bộ port
   từ prototype. stage ở đây là tên CHẶNG ('Xác nhận'/'Duyệt'), không phải tên LÀN như prototype gốc
   ('Cần gán người'/'Chờ duyệt') — màn này đã bỏ khái niệm làn, đổi sang dải 4 chặng trên IssueBar
   (xem IssueBar.tsx STAGES), nên banner đổi theo cho khớp vocabulary với dải. */
type MkOk = { iid: string; stage: string };
type ConfirmOk = { aid: string; owner: string };

/* WorkPage — container #/work, owner chốt phương án (a): MỘT danh sách thanh ngang duy nhất
   (IssueBar), thay board 4 làn của prototype (V.work, output/cxm-platform-prototype.html dòng
   2898-2963). Container đọc store, mọi suy luận domain tính sẵn rồi truyền props xuống IssueBar —
   theo đúng lối QuantifyPage.tsx đọc store + IssueBar là component thuần presentational. */

/* Màu chấm mức độ nghiêm trọng — TRÙNG CHỦ Ý với sevColor() ở
   features/overview/blocks/TopPriorityBlock.tsx (dòng ~26-28): feature này KHÔNG được import chéo
   feature Overview nên viết lại cục bộ. Cùng logic: critical→--crit, high→--watch, còn lại→--ink3 —
   mức độ NGHIÊM TRỌNG của issue, không phải mã màu theo pri.total (màu mã hoá ý nghĩa, không mã hoá
   thứ hạng). */
function sevColor(sev: Issue["sev"]): string {
  return sev === "critical" ? "var(--crit)" : sev === "high" ? "var(--watch)" : "var(--ink3)";
}

export function WorkPage() {
  const data = useCxmStore((s) => s.data);
  const advanceAction = useCxmStore((s) => s.advanceAction);
  const createIssue = useCxmStore((s) => s.createIssue);
  const confirmIssue = useCxmStore((s) => s.confirmIssue);
  const owners = useCxmStore((s) => s.owners);
  const approvers = useCxmStore((s) => s.approvers);

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [mkerr, setMkerr] = useState<string | null>(null);
  const [cferr, setCferr] = useState<string | null>(null);
  const [mkok, setMkok] = useState<MkOk | null>(null);
  const [cfok, setCfok] = useState<ConfirmOk | null>(null);

  // Port openCreate() (prototype dòng 4636): mở Tạo → đóng Xác nhận, xoá mkerr + mkok.
  function openCreate() {
    setCreateOpen(true);
    setConfirmId(null);
    setMkerr(null);
    setMkok(null);
  }
  // Port closeCreate() (prototype dòng 4637).
  function closeCreate() {
    setCreateOpen(false);
    setMkerr(null);
  }
  /* Port openAssign() (prototype dòng 4638) + MỘT lệch có chủ đích: prototype gốc KHÔNG xoá mkok ở
     đây (chỉ closeCreate/mkerr/cferr/cfok) — nhưng success criterion #9 của contract W3b yêu cầu rõ
     "mở form Xác nhận trên một thanh bất kỳ → banner-mkok BIẾN MẤT ngay, dù chưa xác nhận xong". Hai
     chỗ này mâu thuẫn nhau trong chính contract; ưu tiên tuân theo mô tả hành vi UI tường minh
     (criterion 9) hơn 4 dòng state literal, vì phần "NGUỒN SỰ THẬT" prototype được đóng khung là nội
     dung/nhãn/thứ tự field, không phải state machine. Đã nêu rõ trong báo cáo cuối, không tự ý đổi
     rồi im lặng. */
  function openConfirm(id: string) {
    setConfirmId(id);
    setCreateOpen(false);
    setCferr(null);
    setCfok(null);
    setMkok(null);
  }
  // Port closeAssign() (prototype dòng 4639), đổi tên hàm sang closeConfirm() theo chặng Xác nhận.
  function closeConfirm() {
    setConfirmId(null);
    setCferr(null);
  }

  function handleCreateSubmit(fields: CreateIssueFields) {
    try {
      const created = createIssue(fields);
      setCreateOpen(false);
      setMkerr(null);
      setCfok(null);
      // createIssue LUÔN đặt cf='pending' (chưa xác nhận) — nhánh "Duyệt" không bao giờ chạy tới,
      // bỏ ternary chết thay vì giữ nhánh không thể xảy ra.
      setMkok({ iid: created.issue.id, stage: "Xác nhận" });
    } catch (e) {
      setMkerr((e as Error).message);
    }
  }

  function handleConfirmSubmit(fields: ConfirmFields) {
    if (!confirmId) return;
    try {
      const action = confirmIssue(confirmId, fields);
      setConfirmId(null);
      setCferr(null);
      setMkok(null);
      setCfok({ aid: confirmId, owner: action.owner });
    } catch (e) {
      setCferr((e as Error).message);
    }
  }

  const act = data.act;

  /* Số dẫn — port nguyên công thức V.work (prototype dòng 2899-2903), ĐÃ SỬA trục đếm 02/08/2026
     (module-a-charter.md, section A4): chặng đầu đổi 'Gán' (owner===UNASSIGNED) → 'Xác nhận'
     (cf==='pending'), nên số dẫn phải đếm theo cùng trục `cf` mà laneOf() đang dùng, không còn đếm
     theo owner nữa. */
  const pendingConfirm = act.filter((a) => a.cf === "pending").length;
  const pend = act.filter((a) => a.cf === "confirmed" && a.ap === "pending").length;
  const onBoard = act.filter((a) => laneOf(a) !== "off").length;
  const closed = act.filter((a) => a.lc === "closed").length;
  /* Giữ ĐÚNG công thức gốc (dòng 2903): KHÔNG rút gọn thành `lc==='ready'`. Hai cách chỉ tương
     đương khi mọi action validated đều đã lên ready/closed, mà validate.ts không bắt buộc điều đó —
     công thức gốc còn bắt được cả trường hợp bất thường validated+blocked. */
  const waitLoop = act.filter((a) => a.iv === "validated" && a.lc !== "closed").length;

  /* Trước 06/08 hai phép đếm này nằm trong một câu mở đầu cỡ lớn ở đầu màn. Owner bỏ khối câu mở
     đầu trên MỌI màn, nhưng ở đây khác hai màn Topic/Nguồn: không chỗ nào khác trên màn nói ra
     chúng, xoá thẳng là mất thông tin thật. Nên chúng xuống hàng chip có sẵn cạnh "chờ khép
     vòng"/"Đã xong" — cùng một hàng đếm, cùng cỡ chữ, đọc được cả bốn trong một liếc.

     Vẫn giữ hai nhánh của câu cũ: khi CÓ việc chờ xác nhận thì đó là việc gấp nhất nên nêu riêng;
     khi hết thì nói tổng số đang trong vòng xử lý, vì "0 chờ xác nhận" không đáng một chip mà lại
     đẩy con số đáng xem ra xa. */
  const loadChip = pendingConfirm
    ? `${pendingConfirm} chờ xác nhận`
    : `${onBoard} trong vòng xử lý`;

  /* Danh sách thanh — lọc theo `lc !== 'closed'`, KHÔNG dùng `laneOf(a) !== 'off'`: `lc==='ready'`
     kéo theo `iv==='validated'` nên laneOf trả 'off' — lọc bằng laneOf sẽ làm việc đang CHỜ KHÉP
     VÒNG biến mất khỏi màn dù `getPrimaryAction` vẫn trả `key:'close'`, tức vẫn còn một bước người
     phải làm. Chỉ việc đã `closed` mới thật sự rời danh sách. Sắp theo `pri.total` giảm dần. */
  const rows = act
    .filter((a) => a.lc !== "closed")
    .map((a) => ({ action: a, issue: data.iss.find((i) => i.id === a.iss) }))
    .filter((r): r is { action: (typeof act)[number]; issue: Issue } => r.issue !== undefined)
    .sort((x, y) => y.issue.pri.total - x.issue.pri.total);

  // Action/issue đang mở form Xác nhận — container tra sẵn stepLabel, WorkConfirmForm không tự tra steps.
  const confirmAction = confirmId ? act.find((a) => a.id === confirmId) : undefined;
  const issueToConfirm = confirmAction ? data.iss.find((i) => i.id === confirmAction.iss) : undefined;
  const confirmStep = issueToConfirm ? data.steps.find((s) => s.id === issueToConfirm.step) : undefined;

  return (
    <div className="p-8">
      <PageTitle route="work" />

      <div className="flex items-center gap-2.5 flex-wrap mb-3.5">
        <button
          type="button"
          data-testid="work-create"
          className={`${btnPrimary} ${btnSizeLg}`}
          onClick={openCreate}
        >
          ＋ Tạo điểm gãy
        </button>
        <span className="t-meta text-[12px]">
          Chỉ tạo khi xác định được bước trong hành trình và chỉ số dùng để kết luận.
        </span>
        <div className="grow" />
        {/* Bốn chip đếm, xếp theo thứ tự việc chảy qua: đang tới → chờ duyệt → chờ khép vòng → đã
            xong. Hai chip đầu là hai phép đếm dời từ câu mở đầu cũ xuống (owner 06/08). */}
        <span
          data-testid="chip-load"
          className="inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-surface-2 border-line text-ink-2"
        >
          {loadChip}
        </span>
        {/* Chờ duyệt = đã xác nhận nhưng còn đợi người có thẩm quyền. Vắng hẳn khi bằng 0, cùng
            luật với chip "chờ khép vòng" ngay dưới — hàng chip đếm việc ĐANG có, không đếm số 0. */}
        {pend > 0 ? (
          <span
            data-testid="chip-pend"
            className="inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-surface-2 border-line text-ink-2"
          >
            {`${pend} chờ duyệt`}
          </span>
        ) : null}
        {waitLoop > 0 ? (
          <span
            data-testid="chip-waitloop"
            className="inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-watch-bg border-watch-line text-watch"
          >
            {`${waitLoop} chờ khép vòng với khách`}
          </span>
        ) : null}
        {/* Tông trung tính, KHÔNG tô màu trạng thái — prototype để chip này trơn (dòng 2922). */}
        <span
          data-testid="chip-closed"
          className="inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-surface-2 border-line text-ink-2"
        >
          {`Đã xong ${closed}`}
        </span>
      </div>

      {/* Banner — Note.tsx hardcode data-testid="note" nên bọc ngoài bằng div mang testid riêng
          (banner-mkok/banner-asok — testid CỐ Ý giữ nguyên tên gốc, xem ghi chú type ConfirmOk ở
          trên); test KHÔNG được query Note bằng testid vì có thể có nhiều Note cùng lúc trên màn
          (info block của WorkConfirmForm + banner + error note). */}
      {mkok ? (
        <div data-testid="banner-mkok" className="mb-3.5">
          <Note tone="bd">
            <div className="flex items-center gap-2.5">
              <span>
                {`Đã tạo ${mkok.iid}. Thẻ đang ở chặng ${mkok.stage}. Toàn bộ liên kết dữ liệu vẫn hợp lệ — không có banner đỏ nghĩa là validateFixture() đã chấp nhận bản ghi mới.`}
              </span>
              <button
                type="button"
                data-testid="banner-mkok-hide"
                className={`ml-auto flex-none ${btnSecondary} ${btnSizeSm}`}
                onClick={() => setMkok(null)}
              >
                ẩn
              </button>
            </div>
          </Note>
        </div>
      ) : null}
      {cfok ? (
        <div data-testid="banner-asok" className="mb-3.5">
          <Note tone="bd">
            <div className="flex items-center gap-2.5">
              <span>{`Đã xác nhận ${cfok.aid} (phụ trách: ${cfok.owner}), điểm gãy đã chuyển sang chặng Duyệt.`}</span>
              <button
                type="button"
                data-testid="banner-asok-hide"
                className={`ml-auto flex-none ${btnSecondary} ${btnSizeSm}`}
                onClick={() => setCfok(null)}
              >
                ẩn
              </button>
            </div>
          </Note>
        </div>
      ) : null}

      {createOpen ? (
        <div className="mb-3.5">
          <WorkCreateForm
            steps={data.steps}
            metrics={data.metrics}
            owners={owners}
            approvers={approvers}
            error={mkerr}
            onSubmit={handleCreateSubmit}
            onCancel={closeCreate}
          />
        </div>
      ) : null}
      {confirmId && confirmAction && issueToConfirm && confirmStep ? (
        <div className="mb-3.5">
          <WorkConfirmForm
            issue={issueToConfirm}
            action={confirmAction}
            stepLabel={`${confirmStep.code} · ${confirmStep.name}`}
            owners={owners}
            approvers={approvers}
            error={cferr}
            onSubmit={handleConfirmSubmit}
            onCancel={closeConfirm}
          />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div data-testid="work-empty" className="t-meta">
          Không còn điểm gãy nào cần xử lý.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ action, issue }) => {
            const outcome = data.out.find((o) => o.act === action.id);
            return (
              <IssueBar
                key={action.id}
                issue={issue}
                action={action}
                stage={laneOf(action)}
                primary={getPrimaryAction(action, outcome, action.lc === "closed")}
                blockedReason={advanceBlockedReason(action, outcome)}
                sevColor={sevColor(issue.sev)}
                onAdvance={() => advanceAction(action.id)}
                onConfirm={() => openConfirm(action.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
