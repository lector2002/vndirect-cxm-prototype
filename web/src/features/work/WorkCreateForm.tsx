import { useState } from "react";
import type { CreateIssueFields } from "../../data/repository.ts";
import type { IssueSev, Metric, Step } from "../../data/schema/index.ts";
import { Card, Note, btnPrimary, btnSecondary, btnSizeMd } from "../../design-system/index.ts";

/* SEV_LABEL — port prototype dòng 1504. Nguồn DUY NHẤT của 3 chuỗi này trong toàn bộ codebase:
   WorkConfirmForm.tsx import lại đúng bảng này (không định nghĩa lần hai). */
export const SEV_LABEL: Record<IssueSev, string> = {
  critical: "Cần xử lý ngay",
  high: "Cần theo dõi",
  medium: "Đang quan sát",
};

const SEV_ORDER: IssueSev[] = ["critical", "high", "medium"];

/** input[type=date] trả 'yyyy-MM-dd', model lưu 'dd/MM/yyyy' — port vnDate() prototype dòng 4628.
    Nguồn DUY NHẤT: WorkConfirmForm.tsx import lại hàm này, không viết lần hai. */
export function vnDate(v: string): string {
  const p = v.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

export type WorkCreateFormProps = {
  steps: Step[];
  metrics: Metric[];
  owners: string[];
  approvers: string[];
  error: string | null;
  onSubmit: (fields: CreateIssueFields) => void;
  onCancel: () => void;
};

const selectCls = "w-full border border-line rounded px-2 py-1.5 text-sm bg-surface";
const inputCls = "w-full border border-line rounded px-2 py-1.5 text-sm bg-surface";
const hintCls = "t-meta text-[11.5px] mt-1";

export function WorkCreateForm({ steps, metrics, owners, approvers, error, onSubmit, onCancel }: WorkCreateFormProps) {
  const [step, setStep] = useState(steps[0]?.id ?? "");
  const [metric, setMetric] = useState(metrics[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [sev, setSev] = useState<IssueSev>("high");
  const [owner, setOwner] = useState("");
  const [acc, setAcc] = useState(approvers[0] ?? "");
  const [due, setDue] = useState("");
  const [plain, setPlain] = useState("");

  function handleSubmit() {
    onSubmit({ title, step, metric, sev, owner, acc, due: vnDate(due), plain });
  }

  return (
    <Card
      title="Tạo điểm gãy mới"
      subtitle="Điểm gãy phải neo vào một bước trong hành trình và một chỉ số dùng để kết luận — nếu không thì sau này không ai đo được là đã sửa xong hay chưa."
    >
      {error ? <Note tone="crit">{error}</Note> : null}

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${error ? "mt-3" : ""}`}>
        <div>
          <label htmlFor="wcf-step" className="t-lbl block mb-1">Bước trong hành trình</label>
          <select id="wcf-step" className={selectCls} value={step} onChange={(e) => setStep(e.target.value)}>
            {steps.map((s) => (
              <option key={s.id} value={s.id}>{`${s.code} · ${s.name}`}</option>
            ))}
          </select>
          <div className={hintCls}>Chỉ 6 bước của pilot có dữ liệu quan sát</div>
        </div>
        <div>
          <label htmlFor="wcf-metric" className="t-lbl block mb-1">Chỉ số dùng để kết luận</label>
          <select id="wcf-metric" className={selectCls} value={metric} onChange={(e) => setMetric(e.target.value)}>
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>{`${m.name} · ${m.target}`}</option>
            ))}
          </select>
          <div className={hintCls}>Đây là thước đo ở chặng Verify sau này</div>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="wcf-title" className="t-lbl block mb-1">Tiêu đề — một câu nói rõ khách đang gặp gì</label>
        <input
          id="wcf-title"
          type="text"
          className={inputCls}
          placeholder="ví dụ: Khách không nhận được xác nhận sau khi ký hợp đồng"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
        <div>
          <label htmlFor="wcf-sev" className="t-lbl block mb-1">Mức nghiêm trọng</label>
          <select id="wcf-sev" className={selectCls} value={sev} onChange={(e) => setSev(e.target.value as IssueSev)}>
            {SEV_ORDER.map((s) => (
              <option key={s} value={s}>{SEV_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="wcf-owner" className="t-lbl block mb-1">Người xử lý</label>
          <select id="wcf-owner" className={selectCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">— để gán sau —</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {/* Điểm gãy mới LUÔN vào chặng Xác nhận, không phụ thuộc ô này: createIssue đặt
              cf:'pending', mà laneOf() đọc cf chứ không đọc owner (domain/state.ts). Điền sẵn người
              xử lý chỉ là dọn trước việc cho form xác nhận, KHÔNG bỏ qua được bước xác nhận — vì
              chính lúc xác nhận mới đóng băng số liệu làm mốc so sánh. Chuỗi cũ ("Để trống thì thẻ
              nằm ở chặng Gán") sai cả từ vựng lẫn logic sau Module A. */}
          <div className={hintCls}>Điền sẵn cũng vẫn phải qua chặng Xác nhận</div>
        </div>
        <div>
          <label htmlFor="wcf-acc" className="t-lbl block mb-1">Người duyệt</label>
          <select id="wcf-acc" className={selectCls} value={acc} onChange={(e) => setAcc(e.target.value)}>
            {approvers.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="wcf-due" className="t-lbl block mb-1">Hạn xử lý</label>
          <input id="wcf-due" type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
          <div className={hintCls}>Trống thì đặt 14 ngày</div>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="wcf-plain" className="t-lbl block mb-1">Mô tả cho người đọc — không dùng thuật ngữ nội bộ</label>
        <textarea
          id="wcf-plain"
          rows={2}
          className={inputCls}
          placeholder="Trống thì hệ thống ghi sẵn một câu nêu rõ đây là điểm gãy mới, chưa có bằng chứng."
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2.5 mt-3.5">
        <button type="button" className={`${btnPrimary} ${btnSizeMd}`} onClick={handleSubmit}>
          Tạo điểm gãy
        </button>
        <button type="button" className={`${btnSecondary} ${btnSizeMd}`} onClick={onCancel}>
          Hủy
        </button>
        <span className="ml-auto t-meta text-[11.5px] max-w-[46ch] text-right">
          Bản ghi mới sinh kèm một hành động ở trạng thái chờ duyệt và điểm ưu tiên tự tính từ mức nghiêm trọng
          cộng số khách rơi tại bước. Không có bằng chứng nào được gán — độ tin cậy đặt 50%.
        </span>
      </div>
    </Card>
  );
}
