import { useState } from "react";
import type { ConfirmFields } from "../../data/repository.ts";
import type { Action, Issue } from "../../data/schema/index.ts";
import { Card, Note, btnPrimary, btnSecondary, btnSizeMd } from "../../design-system/index.ts";
import { SEV_LABEL, vnDate } from "./WorkCreateForm.tsx";

/* WorkConfirmForm — chặng Xác nhận (thay chặng Gán, owner chốt 02/08/2026, module-a-charter.md
   section A4). Đây KHÔNG chỉ là gán người xử lý: bấm nút chính còn ĐÓNG BĂNG baseline (Snapshot)
   cho issue — mốc so sánh dùng để kết luận cải thiện/xấu đi sau này (xem confirmIssue trong
   data/repository.ts). Vẫn hỏi đủ 3 field owner/acc/due như form Gán cũ vì Action.owner/acc/due giữ
   nguyên trong schema (chỉ gộp vào chặng Xác nhận thay vì là chặng riêng — quyết định owner). */
export type WorkConfirmFormProps = {
  issue: Issue;
  action: Action;
  /** Nhãn bước, container tính sẵn bằng `${s.code} · ${s.name}` — component KHÔNG tự tra bảng steps. */
  stepLabel: string;
  owners: string[];
  approvers: string[];
  error: string | null;
  onSubmit: (fields: ConfirmFields) => void;
  onCancel: () => void;
};

const selectCls = "w-full border border-line rounded px-2 py-1.5 text-sm bg-surface";
const inputCls = "w-full border border-line rounded px-2 py-1.5 text-sm bg-surface";
const hintCls = "t-meta text-[11.5px] mt-1";

export function WorkConfirmForm({ issue, action, stepLabel, owners, approvers, error, onSubmit, onCancel }: WorkConfirmFormProps) {
  const [owner, setOwner] = useState("");
  const [acc, setAcc] = useState(action.acc);
  const [due, setDue] = useState("");

  function handleSubmit() {
    const dueConverted = vnDate(due);
    const fields: ConfirmFields = {
      owner,
      ...(acc ? { acc } : {}),
      ...(dueConverted ? { due: dueConverted } : {}),
    };
    onSubmit(fields);
  }

  return (
    <Card title={`Xác nhận điểm gãy · ${issue.id}`} subtitle={issue.title}>
      {error ? <Note tone="crit">{error}</Note> : null}

      <Note>
        <div className={`grid grid-cols-2 gap-x-4 gap-y-2 ${error ? "mt-3" : ""}`}>
          <div>
            <span className="t-lbl block mb-0.5">Bước</span>
            <span className="t-body">{stepLabel}</span>
          </div>
          <div>
            <span className="t-lbl block mb-0.5">Mức</span>
            <span className="t-body">{SEV_LABEL[issue.sev]}</span>
          </div>
          <div>
            <span className="t-lbl block mb-0.5">Khách bị ảnh hưởng</span>
            {/* `imp.aff` gõ tay đã bỏ 14/08 (ADR-002 §16) và số đo thật chưa về (cần map điểm gãy →
                giá trị điểm đo + số khách độc lập theo giá trị, xem web/docs/ideal-data-model.md
                mục A). Nói thẳng "chưa tính được" thay vì in một số 0 — đây đúng là chỗ luật không
                trộn chưa-biết với thiếu áp vào: người đang xác nhận một điểm gãy mà đọc "0 khách"
                sẽ kết luận ngược hẳn sự thật. */}
            <span className="t-body text-ink-3">chưa tính được</span>
          </div>
          <div>
            <span className="t-lbl block mb-0.5">Bằng chứng</span>
            {/* Giữ nguyên màu --crit của prototype cho "chưa có": ở đây --crit mang nghĩa "thiếu thứ
                đáng lo", khớp ngữ nghĩa hệ 4-màu-trạng-thái hiện dùng, không phải case ngoại lệ. */}
            <span className={`t-body ${issue.ev.length > 0 ? "" : "text-crit"}`}>
              {issue.ev.length > 0 ? `${issue.ev.length} bản ghi` : "chưa có"}
            </span>
          </div>
        </div>
      </Note>

      {/* luật 11/08 (bổ sung): bỏ hẳn cảnh báo hệ quả không hoàn tác được */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div>
          {/* Prefix "cfm-" (ConFirM) — KHÔNG dùng "wcf-" vì đó là prefix id ĐÃ CÓ của WorkCreateForm
              (wcf-owner/wcf-acc/wcf-due), trùng sẽ vỡ liên kết htmlFor/id nếu cả hai form từng cùng
              mặt DOM. */}
          <label htmlFor="cfm-owner" className="t-lbl block mb-1">Người xử lý</label>
          <select id="cfm-owner" className={selectCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">— chọn người —</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cfm-acc" className="t-lbl block mb-1">Người duyệt</label>
          <select id="cfm-acc" className={selectCls} value={acc} onChange={(e) => setAcc(e.target.value)}>
            {approvers.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cfm-due" className="t-lbl block mb-1">Hạn xử lý</label>
          <input id="cfm-due" type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
          <div className={hintCls}>{`Trống thì giữ hạn ${action.due}`}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-3.5">
        <button type="button" data-testid="confirm-submit" className={`${btnPrimary} ${btnSizeMd}`} onClick={handleSubmit}>
          Xác nhận điểm gãy
        </button>
        <button type="button" className={`${btnSecondary} ${btnSizeMd}`} onClick={onCancel}>
          Hủy
        </button>
        {/* luật 11/08: bỏ ghi chú về bản thật */}
      </div>
    </Card>
  );
}
