import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Issue } from "../../data/schema/index.ts";
import type { ConfirmFields, CreateIssueFields } from "../../data/repository.ts";
import type { IssueScore } from "../../data/priority.ts";
import { PRI_KEYS, PRI_LABEL, isRankable, scoreIssues } from "../../data/priority.ts";
import { advanceBlockedReason, getPrimaryAction, laneOf } from "../../domain/index.ts";
import { IssueBar, Note, btnPrimary, btnSecondary, btnSizeLg, btnSizeSm } from "../../design-system/index.ts";
import { PageTitle } from "../../nav.tsx";
import { isoFromVn } from "../../data/projectSigTrend.ts";
import { useCxmStore } from "../../store/store.ts";
import { SEV_LABEL, WorkCreateForm } from "./WorkCreateForm.tsx";
import { WorkConfirmForm } from "./WorkConfirmForm.tsx";

/* Banner "vừa tạo/vừa xác nhận" — port ST.sel.mkok/ST.sel.asok (prototype ~dòng 4636-4684); TÊN BIẾN
   giữ nguyên gốc mkok/asok dù chặng đã đổi 'Gán'→'Xác nhận' (owner chốt 02/08/2026,
   module-a-charter.md, section A4) — không phải vocabulary hiển thị, chỉ là định danh nội bộ port
   từ prototype. stage ở đây là tên CHẶNG ('Xác nhận'/'Duyệt'), không phải tên LÀN như prototype gốc
   ('Cần gán người'/'Chờ duyệt') — màn này đã bỏ khái niệm làn, đổi sang chip tên chặng trên IssueBar
   (xem IssueBar.tsx STAGE_INFO; 25/08 dải 4 ô thu về một chip), nên banner đổi theo cho khớp
   vocabulary với chặng. */
type MkOk = { iid: string; stage: string };
type ConfirmOk = { aid: string; owner: string };

/* WorkPage — container #/work, owner chốt phương án (a): MỘT danh sách thanh ngang duy nhất
   (IssueBar), thay board 4 làn của prototype (V.work, output/cxm-platform-prototype.html dòng
   2898-2963). Container đọc store, mọi suy luận domain tính sẵn rồi truyền props xuống IssueBar —
   theo đúng lối QuantifyPage.tsx đọc store + IssueBar là component thuần presentational. */

/* Màu chấm mức độ nghiêm trọng — TRÙNG CHỦ Ý với sevColor() ở
   features/overview/blocks/TopPriorityBlock.tsx (dòng ~26-28): feature này KHÔNG được import chéo
   feature Overview nên viết lại cục bộ. Cùng logic: critical→--crit, high→--watch, còn lại→--ink3 —
   mức độ NGHIÊM TRỌNG của issue, không phải mã màu theo điểm ưu tiên (màu mã hoá ý nghĩa, không mã hoá
   thứ hạng). */
function sevColor(sev: Issue["sev"]): string {
  return sev === "critical" ? "var(--crit)" : sev === "high" ? "var(--watch)" : "var(--ink3)";
}

/* Nhãn chữ cho chấm sev (25/08 đợt 2) — chấm màu trần không tự giải thích được. Dùng lại SEV_LABEL
   (nguồn duy nhất của 3 chuỗi, WorkCreateForm.tsx:6-12) + tiền tố đúng label field của form. */
function sevLabelOf(sev: Issue["sev"]): string {
  return `Mức nghiêm trọng: ${SEV_LABEL[sev]}`;
}

/* Quá hạn = due TRƯỚC data.asOf — cùng trục thời gian màn Sources đo stale/down (sources.test.ts so
   `up` với asOf), KHÔNG dùng đồng hồ thật: cả vũ trụ demo đóng băng tại asOf, so với new Date() thì
   toàn bảng đỏ vĩnh viễn và mỗi tuần một sai thêm. isoFromVn trả null khi sai khuôn → coi như không
   quá hạn, không đoán. Export 25/08: màn Assistant đếm "việc quá hạn" phải đi qua ĐÚNG hàm này —
   một định nghĩa quá hạn cho cả hai màn, cùng luật SEV_LABEL một nguồn. */
export function isOverdue(due: string, asOf: string): boolean {
  const d = isoFromVn(due);
  const a = isoFromVn(asOf);
  return d !== null && a !== null && d < a;
}

export function WorkPage() {
  const navigate = useNavigate();
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const dims = useCxmStore((s) => s.dims);
  const advanceAction = useCxmStore((s) => s.advanceAction);
  const createIssue = useCxmStore((s) => s.createIssue);
  const confirmIssue = useCxmStore((s) => s.confirmIssue);
  const owners = useCxmStore((s) => s.owners);
  const approvers = useCxmStore((s) => s.approvers);

  const [createOpen, setCreateOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
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
     phải làm. Chỉ việc đã `closed` mới thật sự rời danh sách. */
  const scores = scoreIssues(data, cfg, dims);
  const scoreOf = (id: string): IssueScore => scores.get(id) as IssueScore;

  const allRows = act
    .filter((a) => a.lc !== "closed")
    .map((a) => ({ action: a, issue: data.iss.find((i) => i.id === a.iss) }))
    .filter((r): r is { action: (typeof act)[number]; issue: Issue } => r.issue !== undefined);

  /* Việc đã khép vòng — chỉ render khi bấm xoè chip "Đã xong" (25/08 đợt 2). Dòng TĨNH gọn, KHÔNG
     dùng IssueBar: getPrimaryAction với việc đã đóng trả CTA "Hoàn tất" — một nút trên việc đã xong
     là mời bấm vào ngõ cụt. */
  const closedRows = act
    .filter((a) => a.lc === "closed")
    .map((a) => ({ action: a, issue: data.iss.find((i) => i.id === a.iss) }))
    .filter((r): r is { action: (typeof act)[number]; issue: Issue } => r.issue !== undefined);

  /* HAI KHỐI, không một danh sách (ADR-002 §19). Điểm gãy còn thiếu khoá KHÔNG được xếp lẫn: thiếu
     khoá thì điểm thấp GIẢ, nên một điểm gãy nặng mà chưa map điểm đo sẽ tụt xuống đáy và không ai
     thấy. Đẩy nó lên đầu cũng sai theo chiều ngược lại. Cách duy nhất không nói dối là tách ra và
     ghi rõ thiếu khoá nào.

     Khối dưới TỰ NÓ LÀ DANH SÁCH VIỆC PHẢI ĐIỀN cho owner — map điểm đo, điền `jc`/`reg` cho từng
     bước. Tuần đầu sau khi dựng nó chứa TẤT CẢ điểm gãy và khối trên rỗng: đó là trạng thái đúng
     (§14), không phải hồi quy — trước đây chúng trông "đủ" chỉ vì điểm được gõ tay vào fixture. */
  const rows = allRows
    .filter((r) => isRankable(scoreOf(r.issue.id)))
    .sort((x, y) => scoreOf(y.issue.id).total - scoreOf(x.issue.id).total);

  /* Trong khối chưa xếp được, sắp theo SỐ KHOÁ CÒN THIẾU tăng dần: cái gần đủ nhất đứng trước, vì
     đó là cái owner tốn ít công nhất để đưa lên được khối trên. KHÔNG sắp theo `total` — con số đó
     ở đây không so sánh được giữa hai điểm gãy thiếu khác nhau. */
  const pending = allRows
    .filter((r) => !isRankable(scoreOf(r.issue.id)))
    .sort((x, y) => scoreOf(x.issue.id).missing.length - scoreOf(y.issue.id).missing.length);

  /* 25/08 (owner, brainstorm redesign — phương án A "dòng nén"): thanh THIẾU KHOÁ không in số tổng
     nữa — chính §19 gọi đó là "điểm thấp GIẢ", in nó to ngang điểm thật là tự mâu thuẫn. Số chỉ
     xuất hiện khi đủ khoá; thanh thiếu mang "thiếu N/7 khoá" + priDetail là danh sách khoá thiếu
     (IssueBar render thành chip bấm xoè — thay cho dòng "Thiếu: ..." lặp y hệt dưới cả 5 thanh). */
  const priLabelOf = (id: string): string => {
    const s = scoreOf(id);
    return s.missing.length === 0
      ? `Ưu tiên ${s.total} · đủ ${PRI_KEYS.length}/${PRI_KEYS.length}`
      : `Thiếu ${s.missing.length}/${PRI_KEYS.length} khoá`;
  };
  const priDetailOf = (id: string): string | undefined => {
    const s = scoreOf(id);
    return s.missing.length > 0 ? s.missing.map((k) => PRI_LABEL[k]).join(" · ") : undefined;
  };

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
        {/* luật 11/08: bỏ hướng dẫn */}
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
        {/* Tông trung tính, KHÔNG tô màu trạng thái — prototype để chip này trơn (dòng 2922).
            25/08 đợt 2 (owner): chip thành NÚT bấm xoè danh sách việc đã khép vòng cuối trang —
            trước đó nó đếm những dòng danh sách cố ý giấu (lọc lc!=='closed'), tức một con số
            không soi được. Bằng 0 thì disable: không có gì để xoè. */}
        <button
          type="button"
          data-testid="chip-closed"
          aria-expanded={closedOpen}
          disabled={closed === 0}
          className={`inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-surface-2 border-line text-ink-2 ${closed > 0 ? "cursor-pointer hover:text-ink" : ""}`}
          onClick={() => setClosedOpen((v) => !v)}
        >
          {`Đã xong ${closed}${closed > 0 ? (closedOpen ? " ▴" : " ▾") : ""}`}
        </button>
      </div>

      {/* Banner — Note.tsx hardcode data-testid="note" nên bọc ngoài bằng div mang testid riêng
          (banner-mkok/banner-asok — testid CỐ Ý giữ nguyên tên gốc, xem ghi chú type ConfirmOk ở
          trên); test KHÔNG được query Note bằng testid vì có thể có nhiều Note cùng lúc trên màn
          (info block của WorkConfirmForm + banner + error note). */}
      {mkok ? (
        <div data-testid="banner-mkok" className="mb-3.5">
          <Note tone="bd">
            <div className="flex items-center gap-2.5">
              {/* luật 11/08: bỏ vế "Toàn bộ liên kết dữ liệu vẫn hợp lệ — không có banner đỏ nghĩa là validateFixture() đã chấp nhận bản ghi mới" */}
              <span>{`Đã tạo ${mkok.iid}. Thẻ đang ở chặng ${mkok.stage}.`}</span>
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
      {allRows.length === 0 ? (
        <div data-testid="work-empty" className="t-meta">
          Không còn điểm gãy nào cần xử lý.
        </div>
      ) : (
        <>
          {rows.length > 0 ? (
            <div className="flex flex-col gap-3" data-testid="work-ranked">
              {rows.map(({ action, issue }) => renderBar(action, issue))}
            </div>
          ) : (
            /* Khối trên rỗng KHÔNG được im lặng: một danh sách trống ở chỗ vốn có thứ tự việc phải
               làm sẽ đọc thành "hết việc rồi", trong khi sự thật là "chưa đủ dữ liệu để xếp".
               25/08 đợt 2: cắt câu 2 ("Danh sách bên dưới ghi rõ...") — header khối dưới + chip
               "Thiếu N/7 khoá" trên từng thanh đã nói đúng điều đó, câu này là lớp thứ ba. */
            <div data-testid="work-none-rankable">
              <Note>
                {`Chưa điểm gãy nào đủ ${PRI_KEYS.length}/${PRI_KEYS.length} khoá để xếp hạng.`}
              </Note>
            </div>
          )}

          {pending.length > 0 ? (
            <div className="mt-6" data-testid="work-pending">
              <div className="t-lbl mb-2">{`Chưa đủ dữ liệu để xếp · ${pending.length}`}</div>
              <div className="flex flex-col gap-3">
                {pending.map(({ action, issue }) => renderBar(action, issue))}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Khối "Đã xong" — nằm NGOÀI nhánh allRows.length===0: bảng sạch việc là đúng lúc người ta
          muốn ngó lại những gì đã khép. Chỉ hiện khi bấm xoè chip đếm ở trên. */}
      {closedOpen && closedRows.length > 0 ? (
        <div className="mt-6" data-testid="work-closed">
          <div className="t-lbl mb-2">{`Đã xong · ${closedRows.length}`}</div>
          <div className="flex flex-col gap-2">
            {closedRows.map(({ action, issue }) => (
              <div
                key={action.id}
                data-testid={`closed-row-${action.id}`}
                className="w-full bg-surface border border-line rounded shadow-card px-3.5 py-2.5 flex items-center gap-2.5 text-[12.5px]"
              >
                <span className="font-semibold text-ink-3 min-w-0 truncate">{issue.title}</span>
                <span className="ml-auto flex-none whitespace-nowrap text-[12px] text-ink-3">
                  {`xử lý: ${action.owner} · duyệt: ${action.acc} · Đã khép vòng`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  /* 25/08 (owner, brainstorm redesign): form Xác nhận nở NGAY DƯỚI thanh đang thao tác thay vì một
     khối cố định đầu trang — trước đây bấm nút ở thanh thứ 5 thì form hiện tít trên đầu, ngoài tầm
     mắt. Guard confirmAction/issueToConfirm/confirmStep giữ nguyên như khối cũ. */
  function renderBar(action: (typeof act)[number], issue: Issue) {
    const outcome = data.out.find((o) => o.act === action.id);
    return (
      <div key={action.id} className="flex flex-col gap-2.5">
        <IssueBar
          issue={issue}
          action={action}
          stage={laneOf(action)}
          primary={getPrimaryAction(action, outcome, action.lc === "closed")}
          blockedReason={advanceBlockedReason(action, outcome)}
          sevColor={sevColor(issue.sev)}
          sevLabel={sevLabelOf(issue.sev)}
          overdue={isOverdue(action.due, data.asOf)}
          priLabel={priLabelOf(issue.id)}
          priDetail={priDetailOf(issue.id)}
          onAdvance={() => advanceAction(action.id)}
          onConfirm={() => openConfirm(action.id)}
          /* 25/08: màn #/issue/:id đã dựng (Module B) — mở hồ sơ thật từ tiêu đề và từ link ở dòng
             bị chặn, thay chỗ prototype điều hướng ngay trong advance() (repo vẫn no-op an toàn). */
          onOpenIssue={() => navigate(`/issue/${issue.id}`)}
        />
        {confirmId === action.id && confirmAction && issueToConfirm && confirmStep ? (
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
        ) : null}
      </div>
    );
  }
}
