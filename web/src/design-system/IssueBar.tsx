import type { Action, Issue } from "../data/schema/index.ts";
import type { LaneKey, PrimaryAction } from "../domain/index.ts";
import { btnPrimary, btnSecondary, btnSizeMd } from "./buttons.ts";

/* IssueBar — đơn vị hiển thị chính của #/work: MỘT thanh ngang = MỘT điểm gãy, thay cho board 4 làn
   của prototype (owner chốt phương án (a): danh sách thanh ngang duy nhất). Component THUẦN
   presentational — mọi suy luận domain (stage=laneOf(action), primary=getPrimaryAction(),
   blockedReason=advanceBlockedReason()) do container tính sẵn và truyền vào qua props; ở đây chỉ
   render đúng những gì được đưa. */
export type IssueBarProps = {
  issue: Issue;
  action: Action;
  /** Chặng hiện tại, container tính sẵn bằng laneOf(action). 'off' = đã ra khỏi 4 chặng. */
  stage: LaneKey;
  /** CTA bước kế tiếp, container tính sẵn bằng getPrimaryAction(). */
  primary: PrimaryAction;
  /** Lý do KHÔNG được chạy bước kế tiếp (container tính bằng advanceBlockedReason()); null = được chạy. */
  blockedReason: string | null;
  /** Màu chấm mức độ nghiêm trọng — container truyền vào, design-system KHÔNG tự suy ngữ nghĩa domain. */
  sevColor: string;
  onAdvance: () => void;
  onOpenIssue?: () => void;
  /** Khi stage==='confirm' VÀ prop này được truyền: CTA đổi sang "Xác nhận điểm gãy" (không phải
      onAdvance) — sửa lỗi bar hiện "Duyệt đề xuất xử lý" trong khi action còn cf==='pending' (owner
      chốt, W3b Việc 1; chặng đổi tên 'assign'→'confirm' 02/08/2026, module-a-charter.md A3). Không
      truyền hoặc stage khác 'confirm': giữ nguyên hành vi advance cũ.
      Đổi tên `onAssign` → `onConfirm` tại Section A4 (module-a-charter.md), khớp chặng đã đổi tên.
      Testid DOM `assign-${action.id}` CỐ Ý giữ nguyên (không đổi theo tên prop): đây là chuỗi hằng
      dùng để test truy vấn phần tử, không phải vocabulary hiển thị cho người dùng — đổi nó chỉ để
      khớp tên biến nội bộ là việc không cần thiết, mọi test truy vấn theo testid này vẫn còn đúng
      ngữ nghĩa (nút vẫn là hành động "assign work to this issue via confirm step"). */
  onConfirm?: () => void;
};

/* Thứ tự và nhãn 4 chặng CỐ ĐỊNH — khớp LaneKey 'confirm'|'approve'|'fix'|'verify' (state.ts:8,
   không gồm 'off' vì 'off' nghĩa là đã ra khỏi dải, không phải một ô trên dải). */
const STAGES: { key: "confirm" | "approve" | "fix" | "verify"; num: number; label: string }[] = [
  { key: "confirm", num: 1, label: "Xác nhận" },
  { key: "approve", num: 2, label: "Duyệt" },
  { key: "fix", num: 3, label: "Sửa" },
  { key: "verify", num: 4, label: "Verify" },
];

type StageStatus = "done" | "current" | "upcoming";

/* Màu theo TRẠNG THÁI (đã qua/đang ở/chưa tới), không phải theo chặng — mỗi ô luôn giữ nguyên vị trí
   trong dải, chỉ đổi tông theo status. Nhãn số+chữ luôn in đủ (a11y: không chỉ dựa vào màu). */
const STAGE_CLASS: Record<StageStatus, string> = {
  done: "bg-primary-soft text-primary",
  current: "bg-primary text-white",
  upcoming: "bg-surface-2 text-ink-3",
};

const TITLE_CLASS = "text-[13.5px] font-semibold leading-snug";

export function IssueBar({ issue, action, stage, primary, blockedReason, sevColor, onAdvance, onOpenIssue, onConfirm }: IssueBarProps) {
  // stage='off' đã ra khỏi 4 chặng xử lý → cả 4 ô đều "đã qua", không ô nào aria-current.
  const currentIndex = stage === "off" ? STAGES.length : STAGES.findIndex((s) => s.key === stage);
  const blocked = blockedReason !== null;

  return (
    <div data-testid={`issue-bar-${issue.id}`} className="w-full bg-surface border border-line rounded shadow-card flex flex-col gap-2.5 p-3.5">
      {/* Tầng 1 — nhận dạng: chấm mức độ nghiêm trọng · tiêu đề · điểm ưu tiên đẩy phải */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-block w-2.5 h-2.5 rounded-full flex-none"
          style={{ background: sevColor }}
        />
        {onOpenIssue ? (
          <button type="button" className={`${TITLE_CLASS} text-left hover:text-primary min-w-0 truncate`} onClick={onOpenIssue}>
            {issue.title}
          </button>
        ) : (
          <span className={`${TITLE_CLASS} min-w-0 truncate`}>{issue.title}</span>
        )}
        <span className="ml-auto flex-none text-[12px] font-semibold text-ink-3 whitespace-nowrap">
          {`Ưu tiên ${issue.pri.total}`}
        </span>
      </div>

      {/* Tầng 2 — dải tiến trình 4 chặng, chip khép vòng đẩy phải cùng hàng */}
      <div className="flex items-center gap-1.5">
        {STAGES.map((s, i) => {
          const status: StageStatus = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          return (
            <div
              key={s.key}
              data-testid={`stage-${s.key}`}
              aria-current={status === "current" ? "step" : undefined}
              className={`flex-1 text-center rounded text-[11px] font-semibold px-2 py-1 whitespace-nowrap ${STAGE_CLASS[status]}`}
            >
              {/* Dấu ✓ cho chặng ĐÃ QUA là kênh phân biệt KHÔNG-PHẢI-MÀU. Đo trên dist thật: nền ô đã
                  qua là rgb(253,243,238) còn ô chưa tới là rgb(244,242,239) — hai màu gần như không
                  tách được bằng mắt, nên nếu chỉ dựa vào nền thì dải tiến trình mất đúng công dụng của
                  nó (nhìn phát biết đang ở đâu). Ô đang ở đã có nền cam đậm + aria-current nên không
                  cần thêm dấu. */}
              {status === "done" ? `✓ ${s.num} ${s.label}` : `${s.num} ${s.label}`}
            </div>
          );
        })}
        {/* Chỉ chip "chờ khép vòng" mang màu trạng thái (--watch) — đúng prototype, nơi chip này là
            thứ DUY NHẤT được tô (`color:var(--watch)`), còn "Đã xong N" là chip trơn.
            Chip "đã khép vòng" CỐ Ý để tông trung tính, KHÔNG dùng --good: bảng màu tách bạch 4 màu
            TRẠNG THÁI SỨC KHOẺ khỏi tone thông tin (xem chú thích trong tailwind.config.js), mà khép
            vòng là trạng thái QUY TRÌNH — tiêu một màu sức khoẻ cho nó là trộn hai hệ nghĩa, và làm
            loãng chính màu đang cần dành cho việc còn dang dở. */}
        {action.lc === "ready" ? (
          <span
            data-testid={`lc-chip-${action.id}`}
            className="ml-auto flex-none px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-watch-bg border-watch-line text-watch"
          >
            Chờ khép vòng
          </span>
        ) : action.lc === "closed" ? (
          <span
            data-testid={`lc-chip-${action.id}`}
            className="ml-auto flex-none px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap bg-surface-2 border-line text-ink-2"
          >
            Đã khép vòng
          </span>
        ) : null}
      </div>

      {/* Tầng 3 — người phụ trách/hạn và CTA bước kế tiếp. blockedReason !== null: chặn TẠI CHỖ, nêu
          lý do bằng chữ đọc được ngay trên thanh — KHÔNG điều hướng sang màn khác (owner chốt). */}
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] text-ink-3 min-w-0 truncate">
          {`${action.owner} · ${action.acc} · hạn ${action.due}`}
        </span>
        <div className="ml-auto flex-none flex items-center gap-2">
          {/* Chữ xám, KHÔNG --crit: đây là câu GIẢI THÍCH vì sao nút đang khoá, không phải mức độ
              nghiêm trọng của điểm gãy — mà --crit trong hệ này đã có nghĩa "cần xử lý ngay" và đang
              được chấm sev ở tầng 1 dùng. Hai thứ đỏ cạnh nhau mang hai nghĩa khác nhau thì người đọc
              không tách được. Tín hiệu "đang bị chặn" do nút disabled gánh; chữ chỉ cần đọc rõ. */}
          {blocked ? <span className="text-[11.5px] text-ink-2 max-w-[280px]">{blockedReason}</span> : null}
          {/* Nút + dòng ACTOR bên dưới — port workCard() prototype (dòng ~2984): bản gốc luôn in
              `n.actor` dưới nút. Dòng này trả lời "ai phải làm bước này", thứ mà riêng nhãn nút không
              nói được (vd "Duyệt đề xuất xử lý" không cho biết là người phụ trách QUYẾT ĐỊNH chứ không
              phải owner). `actor` rỗng ở bước 'done' nên phải guard. */}
          <div className="flex flex-col items-end gap-1">
            {/* stage==='confirm' + onConfirm: nhánh CTA riêng — sửa lỗi bar hiện "Duyệt đề xuất xử lý"
                trong khi action còn cf==='pending' (getPrimaryAction giờ đã xét action.cf, xem
                domain/loop.ts, nhưng nhánh riêng này vẫn giữ để container tiêm handler xác nhận khác
                onAdvance). blocked đã check TRƯỚC (giữ nguyên thứ tự cũ) dù dữ liệu-wise hai nhánh
                blocked/confirm không bao giờ cùng true (blocked cần Outcome, mà Outcome chỉ có từ
                dl==='released' trở đi, tức đã qua khỏi chặng Xác nhận) — không tối ưu lại thứ tự. */}
            {!blocked && stage === "confirm" && onConfirm ? (
              <>
                <button
                  type="button"
                  data-testid={`assign-${action.id}`}
                  className={`${btnSizeMd} ${btnPrimary}`}
                  onClick={onConfirm}
                >
                  Xác nhận điểm gãy
                </button>
                <span className="text-[11px] text-ink-3 whitespace-nowrap">Không duyệt được khi chưa xác nhận điểm gãy</span>
              </>
            ) : (
              <>
                <button
                  type="button"
                  data-testid={`advance-${action.id}`}
                  disabled={blocked}
                  className={`${btnSizeMd} ${blocked ? `${btnSecondary} opacity-50 cursor-not-allowed` : btnPrimary}`}
                  onClick={onAdvance}
                >
                  {primary.label}
                </button>
                {primary.actor ? (
                  <span className="text-[11px] text-ink-3 whitespace-nowrap">{primary.actor}</span>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
