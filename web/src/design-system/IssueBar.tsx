import { useState } from "react";
import type { Action, Issue } from "../data/schema/index.ts";
import type { LaneKey, PrimaryAction } from "../domain/index.ts";
import { btnPrimary, btnSecondary, btnSizeMd } from "./buttons.ts";

/* IssueBar — đơn vị hiển thị chính của #/work: MỘT thanh ngang = MỘT điểm gãy, thay cho board 4 làn
   của prototype (owner chốt phương án (a): danh sách thanh ngang duy nhất). Component THUẦN
   presentational — mọi suy luận domain (stage=laneOf(action), primary=getPrimaryAction(),
   blockedReason=advanceBlockedReason()) do container tính sẵn và truyền vào qua props; ở đây chỉ
   render đúng những gì được đưa.

   25/08 (owner, brainstorm redesign Workboard — chốt phương án A "dòng nén"):
   - Dải 4 ô chặng full-width BỎ — nó chiếm một hàng riêng trên mọi thanh mà thông tin thật chỉ là
     "đang ở chặng nào". Thay bằng MỘT chip tên chặng hiện tại + vị trí ("Duyệt · 2/4"); owner xem
     mock có dãy ✓✓▶○ và chê rối mắt, chốt hiện thẳng TÊN bước. Chữ trong chip là kênh
     không-phải-màu nên vẫn giữ được lý do a11y của dải cũ.
   - Hai dòng explain dưới nút ("Người phụ trách quyết định" / "Không duyệt được khi chưa xác nhận
     điểm gãy") → `title` của chính nút (pattern 4 đợt quét AI-slop, màn này cố tình chờ redesign).
   - Câu ưu tiên: thanh THIẾU KHOÁ không in số tổng nữa (điểm thấp GIẢ — chữ của chính ADR-002 §19);
     container truyền "thiếu 3/7 khoá" + `priDetail` là danh sách khoá thiếu, chip bấm được để xoè
     danh sách ra thành chữ (cùng bài học SplitToggle.onLockedClick 05/08: tooltip không tới được
     người bấm/bàn phím/cảm ứng). Hết cảnh dòng "Thiếu: ..." lặp y hệt dưới cả 5 thanh.
   - Lý do chặn vẫn là CHỮ ĐỌC ĐƯỢC NGAY TRÊN THANH (owner chốt, không đổi) — nhưng xuống dòng riêng
     full-width chỉ khi CÓ chặn, thay vì bóp vào cạnh nút. */
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
  /** Câu điểm ưu tiên, container tính sẵn — vd `Ưu tiên 72 · đủ 7/7` (đủ khoá) hoặc
      `thiếu 3/7 khoá` (chưa đủ — KHÔNG kèm số tổng, xem docblock trên). Luôn mang số khoá,
      không bao giờ chỉ con số trần (ADR-002 §9). Chuỗi chứ không phải object vì tầng này chỉ render. */
  priLabel: string;
  /** Có mặt ⇒ priLabel render thành CHIP BẤM ĐƯỢC, bấm xoè dòng chữ này ra (danh sách khoá còn
      thiếu). Không truyền ⇒ priLabel là chữ tĩnh. */
  priDetail?: string;
  onAdvance: () => void;
  onOpenIssue?: () => void;
  /** Khi stage==='confirm' VÀ prop này được truyền: CTA đổi sang "Xác nhận điểm gãy" (không phải
      onAdvance). Testid DOM `assign-${action.id}` CỐ Ý giữ nguyên tên gốc port từ prototype —
      chuỗi hằng cho test truy vấn, không phải vocabulary hiển thị (xem lịch sử A4). */
  onConfirm?: () => void;
};

/* Tên + số thứ tự 4 chặng — khớp LaneKey 'confirm'|'approve'|'fix'|'verify' (state.ts:8). 'off'
   nghĩa là đã ra khỏi dải; hiển thị của 'off' do chip khép vòng gánh (lc='ready'/'closed'), chip
   chặng khi đó nói "Đã qua 4/4". */
const STAGE_INFO: Record<Exclude<LaneKey, "off">, { num: number; label: string }> = {
  confirm: { num: 1, label: "Xác nhận" },
  approve: { num: 2, label: "Duyệt" },
  fix: { num: 3, label: "Sửa" },
  verify: { num: 4, label: "Verify" },
};

const TITLE_CLASS = "text-[13.5px] font-semibold leading-snug";
const CHIP_CLASS = "inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap";

export function IssueBar({ issue, action, stage, primary, blockedReason, sevColor, priLabel, priDetail, onAdvance, onOpenIssue, onConfirm }: IssueBarProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const blocked = blockedReason !== null;
  const stageInfo = stage === "off" ? null : STAGE_INFO[stage];

  return (
    <div data-testid={`issue-bar-${issue.id}`} className="w-full bg-surface border border-line rounded shadow-card flex flex-col gap-2 p-3.5">
      {/* Dòng 1 — nhận dạng + trạng thái quy trình: chấm sev · tiêu đề · chip chặng · phụ trách/hạn */}
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
        <span className="ml-auto flex-none flex items-center gap-2">
          {/* Chip chặng: TÊN bước hiện tại + vị trí — chữ là kênh không-phải-màu. aria-current giữ
              nguyên ngữ nghĩa "đây là bước đang ở" như dải cũ. */}
          <span
            data-testid="stage-chip"
            aria-current={stageInfo ? "step" : undefined}
            className={`${CHIP_CLASS} ${stageInfo ? "bg-primary text-white border-primary" : "bg-surface-2 border-line text-ink-3"}`}
          >
            {stageInfo ? `${stageInfo.label} · ${stageInfo.num}/4` : "Đã qua 4/4"}
          </span>
          {/* Chỉ chip "chờ khép vòng" mang màu trạng thái (--watch) — đúng prototype. Chip "đã khép
              vòng" CỐ Ý tông trung tính, KHÔNG --good: khép vòng là trạng thái QUY TRÌNH, không phải
              sức khoẻ (xem chú thích bảng màu trong tailwind.config.js). */}
          {action.lc === "ready" ? (
            <span data-testid={`lc-chip-${action.id}`} className={`${CHIP_CLASS} bg-watch-bg border-watch-line text-watch`}>
              Chờ khép vòng
            </span>
          ) : action.lc === "closed" ? (
            <span data-testid={`lc-chip-${action.id}`} className={`${CHIP_CLASS} bg-surface-2 border-line text-ink-2`}>
              Đã khép vòng
            </span>
          ) : null}
          <span className="text-[12px] text-ink-3 whitespace-nowrap">
            {`${action.owner} · ${action.acc} · hạn ${action.due}`}
          </span>
        </span>
      </div>

      {/* Dòng 2 — điểm ưu tiên trái, CTA phải. Câu actor ("Người phụ trách quyết định") thành
          title của CTA: nó trả lời "ai bấm nút này", đúng chỗ người ta thắc mắc. */}
      <div className="flex items-center gap-2.5">
        {priDetail ? (
          <span className="flex items-baseline gap-2 min-w-0">
            <button
              type="button"
              data-testid={`missing-toggle-${issue.id}`}
              aria-expanded={detailOpen}
              title={priDetail}
              className={`${CHIP_CLASS} bg-surface-2 border-line text-ink-2 hover:text-ink cursor-pointer`}
              onClick={() => setDetailOpen((v) => !v)}
            >
              {`${priLabel} ⓘ`}
            </button>
            {detailOpen ? (
              <span data-testid={`work-missing-${issue.id}`} className="text-[12px] text-ink-3 min-w-0">
                {priDetail}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-ink-3 whitespace-nowrap">{priLabel}</span>
        )}
        <div className="ml-auto flex-none">
          {!blocked && stage === "confirm" && onConfirm ? (
            <button
              type="button"
              data-testid={`assign-${action.id}`}
              title="Không duyệt được khi chưa xác nhận điểm gãy"
              className={`${btnSizeMd} ${btnPrimary}`}
              onClick={onConfirm}
            >
              Xác nhận điểm gãy
            </button>
          ) : (
            <button
              type="button"
              data-testid={`advance-${action.id}`}
              disabled={blocked}
              title={primary.actor || undefined}
              className={`${btnSizeMd} ${blocked ? `${btnSecondary} opacity-50 cursor-not-allowed` : btnPrimary}`}
              onClick={onAdvance}
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>

      {/* Dòng 3 — CHỈ khi bị chặn: lý do bằng chữ đọc được ngay trên thanh (owner chốt, KHÔNG điều
          hướng sang màn khác). Chữ xám, KHÔNG --crit: đây là câu GIẢI THÍCH vì sao nút khoá, không
          phải mức độ nghiêm trọng — chấm sev ở dòng 1 đang giữ nghĩa đỏ đó. */}
      {blocked ? (
        <div className="text-[11.5px] text-ink-2 leading-snug">
          <span aria-hidden="true">⚠ </span>
          {blockedReason}
        </div>
      ) : null}
    </div>
  );
}
