import type { Action, Issue, Outcome } from "../../../data/schema/index.ts";
import { Note, STAGE_INFO, btnPrimary, btnSizeSm } from "../../../design-system/index.ts";
import { advanceBlockedReason, getPrimaryAction, laneOf } from "../../../domain/index.ts";

/* Tab Xử lý — bố cục RIÊNG cho màn chi tiết (quyết định #6 owner 07/08: KHÔNG tái dùng IssueBar),
   nhưng cùng state qua store: nút Advance gọi đúng advanceAction của store nên thẻ trên #/work
   nhảy làn theo — câu nói điều đó (prototype dòng 3340) giữ nguyên.

   getPrimaryAction gọi ĐỦ BA tham số theo đúng quy ước WorkPage (quyết định thiết kế #6 charter):
   thiếu `action.lc === "closed"` thì CXI-013 đã khép vòng vẫn bị mời "Đánh dấu đã khép vòng".
   Dải 4 chặng đọc STAGE_INFO — cùng bảng tên chặng với IssueBar, không chép lần hai. */

export type ActionTabProps = {
  issue: Issue;
  action: Action | undefined;
  outcome: Outcome | undefined;
  onAdvance: (() => void) | undefined;
};

export function ActionTab({ issue, action, outcome, onAdvance }: ActionTabProps) {
  if (!action) {
    return <Note tone="crit">Điểm gãy chưa có hành động xử lý gắn kèm.</Note>;
  }

  const lane = laneOf(action);
  const primary = getPrimaryAction(action, outcome, action.lc === "closed");
  const blockedReason = advanceBlockedReason(action, outcome);
  const done = primary.key === "done";
  const stageNum = lane === "off" ? null : STAGE_INFO[lane].num;

  return (
    <div>
      <Note tone="bd">
        <b>Đề xuất xử lý:</b> {issue.dec}
      </Note>

      <div className="border border-line rounded-[10px] p-3.5 mt-3.5" data-testid="issue-action-card">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-[13.5px] font-semibold">{action.title}</span>
          <span className="font-mono text-[12px] text-ink-3">{action.id}</span>
        </div>
        <div className="text-[12.5px] text-ink-2 mt-1.5">
          {`Người xử lý: ${action.owner || "chưa gán"} · Người duyệt: ${action.acc} · Hạn xử lý: ${action.due}`}
          {action.rel ? ` · Phát hành: ${action.rel}` : ""}
        </div>

        {/* Dải 4 chặng — chặng hiện tại tô đậm; đã khép vòng thì cả dải mờ vì không còn chặng nào */}
        <div className="flex items-center gap-1.5 mt-3" data-testid="issue-action-stages">
          {(Object.keys(STAGE_INFO) as (keyof typeof STAGE_INFO)[]).map((k) => {
            const info = STAGE_INFO[k];
            const current = stageNum !== null && info.num === stageNum;
            return (
              <span
                key={k}
                aria-current={current ? "step" : undefined}
                className={`inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border whitespace-nowrap ${
                  current ? "border-primary text-primary bg-surface" : "border-line bg-surface-2 text-ink-3"
                }`}
              >
                {`${info.num} · ${info.label}`}
              </span>
            );
          })}
          {lane === "off" ? (
            <span className="text-[11.5px] text-ink-3 ml-1">
              {action.lc === "closed" ? "đã khép vòng — hết chặng" : "chờ khép vòng với khách"}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 mt-3.5 flex-wrap">
          {done ? (
            <span className="inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border border-line bg-surface-2 text-ink-2">
              ✓ {primary.label}
            </span>
          ) : (
            <>
              <button
                type="button"
                data-testid="issue-action-advance"
                className={`${btnPrimary} ${btnSizeSm}`}
                disabled={blockedReason !== null}
                onClick={onAdvance}
              >
                {primary.label}
              </button>
              <span className="t-meta text-[12px]">{primary.actor}</span>
            </>
          )}
        </div>
        {blockedReason !== null ? (
          <div className="text-[12.5px] text-crit mt-2" data-testid="issue-action-blocked">
            {blockedReason}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <Note>
          Nút bấm ở đây dùng <b>cùng một state</b> với <a className="text-primary hover:underline" href="#/work">Bảng xử lý</a> — đổi ở
          đây thì thẻ trên board nhảy làn theo. Board sở hữu <i>hàng đợi</i>, còn hồ sơ này chỉ hiển thị đúng
          một hành động, nhưng vẫn thao tác được để không mất ngữ cảnh bằng chứng.
        </Note>
      </div>
    </div>
  );
}
