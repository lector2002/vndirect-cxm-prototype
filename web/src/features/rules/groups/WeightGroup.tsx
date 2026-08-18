import { useState } from "react";
import { Card, Note } from "../../../design-system/index.ts";
import { PRI_KEYS, PRI_LABEL, isRankable, scoreIssues } from "../../../data/priority.ts";
import type { PriKey } from "../../../data/schema/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { ApplySection, FieldRow } from "../RuleLayout.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 6 — Trọng số ưu tiên điểm gãy.

   NHÓM NÀY TỪNG CHỈ ĐỌC, MỞ KHOÁ 14/08 (ADR-002 §1, §13). Lý do cũ — "fixture lưu ĐIỂM TUYỆT ĐỐI
   của 6 thành phần và validateFixture khẳng định sev+aff+jc+rep+tr+reg === total, nên sửa một
   trọng số mà không tính lại total của MỌI điểm gãy sẽ bắn banner đỏ trên mọi màn" — HẾT HIỆU LỰC:
   `iss[].pri` không còn tồn tại, điểm là hàm tính (`data/priority.ts`), và bất biến tổng đã bỏ.

   Khuôn theo nhóm 7 (ranh giới dải) đã chạy: ô nhập ghi qua `useCfgWrite`, `setCfg` ném thì in
   nguyên văn lý do và giữ state cũ.

   MỘT ĐIỂM KHÁC NHÓM 7, và là điểm đáng giá nhất ở đây: XEM TRƯỚC THỨ HẠNG TRƯỚC KHI LƯU. Đổi ranh
   giới dải chỉ đổi CÁCH CHIA; đổi trọng số đổi THỨ TỰ VIỆC PHẢI LÀM ở `#/work`, và điểm là số SỐNG
   nên cú nhảy xảy ra ngay lập tức (§18). Bảng dưới cho thấy thứ hạng sẽ thành thế nào trước khi
   người vận hành bấm lưu — cùng tiền lệ `SegmentGroup.previewCounts`. */

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function WeightGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const dims = useCxmStore((s) => s.dims);
  const { write, error } = useCfgWrite();

  /* Bản nháp sống trong nhóm, KHÔNG ghi thẳng vào cfg mỗi lần gõ: ghi từng ô một sẽ đi qua trạng
     thái tổng ≠ 100 ở mọi bước trung gian (đổi 24 → 20 là tổng thành 96), và `validate` chặn đúng
     luật — người vận hành sẽ không sửa nổi ô nào. Bảy ô sửa xong rồi mới lưu một lần. */
  const [draft, setDraft] = useState<Record<PriKey, number> | null>(null);
  const w = draft ?? cfg.pri.w;
  const sum = PRI_KEYS.reduce((a, k) => a + w[k], 0);
  const dirty = draft !== null && PRI_KEYS.some((k) => draft[k] !== cfg.pri.w[k]);

  const setW = (k: PriKey) => (v: number) => setDraft({ ...w, [k]: v });

  /* Thứ hạng theo bản nháp — tính bằng CHÍNH `scoreIssues` mà `#/work` dùng, truyền cfg ứng viên.
     Không viết lại phép cộng ở đây: một bản sao thứ hai là chỗ xem trước nói khác kết quả thật. */
  const preview = scoreIssues(data, { ...cfg, pri: { ...cfg.pri, w } }, dims);
  const totalOf = (id: string): number => preview.get(id)?.total ?? 0;
  const ranked = data.iss
    .filter((i) => { const s = preview.get(i.id); return s !== undefined && isRankable(s); })
    .sort((a, b) => totalOf(b.id) - totalOf(a.id));

  return (
    <Card title="Priority weights">
      {error ? (
        <div className="mb-3" data-testid="weight-write-error">
          <Note tone="crit">
            <b>Không ghi được.</b> {error}
          </Note>
        </div>
      ) : null}

      <div>
        {PRI_KEYS.map((k) => (
          <FieldRow key={k} label={PRI_LABEL[k]}>
            <NumField value={w[k]} onCommit={setW(k)} suffix="%" label={PRI_LABEL[k]} />
          </FieldRow>
        ))}
      </div>

      {/* Tổng hiện ra LUÔN, không chỉ khi sai: nó là ràng buộc duy nhất giữa bảy ô, và người vận
          hành đang sửa ô thứ ba cần biết mình còn thừa/thiếu bao nhiêu để chia cho bốn ô còn lại. */}
      <div className="mt-2 flex items-center gap-2.5" data-testid="weight-sum">
        <b className="text-[13px]">{`Total: ${sum}`}</b>
        {sum !== 100 ? (
          <span className="text-[12.5px] text-crit">{`còn ${100 - sum} nữa mới đủ 100`}</span>
        ) : null}
        <button
          type="button"
          data-testid="weight-apply"
          disabled={!dirty || sum !== 100}
          onClick={() => {
            if (write({ pri: { ...cfg.pri, w } })) setDraft(null);
          }}
          className="ml-auto flex-none rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 disabled:cursor-default disabled:opacity-45 enabled:hover:border-primary-line enabled:hover:bg-primary-soft enabled:hover:text-ink"
        >
          Save weights
        </button>
      </div>

      <ApplySection
        title={`Ranking ${dirty ? "after save" : "right now"}`}
        summary={ranked.length ? `${ranked.length} breakpoints ranked` : "no breakpoint ranked yet"}
      >
        {ranked.length === 0 ? (
          /* Trạng thái ĐÚNG khi chưa ai điền `jc`/`reg` cho bước nào và chưa map điểm đo: không
             điểm gãy nào đủ 7/7 để xếp. Nói thẳng thay vì hiện một bảng rỗng (ADR-002 §19). */
          <div data-testid="weight-preview-empty">
            <Note>
              {`Chưa điểm gãy nào đủ ${PRI_KEYS.length}/${PRI_KEYS.length} khoá. Trọng số vẫn sửa được, nhưng thứ hạng chỉ hiện ra khi có điểm gãy đo đủ — xem danh sách còn thiếu gì ở màn Bảng xử lý.`}
            </Note>
          </div>
        ) : (
          <table className="w-full border-collapse text-[12.5px]" data-testid="weight-preview">
            <thead>
              <tr>
                <th className={TH}>#</th>
                <th className={TH}>Breakpoint</th>
                <th className={TH}>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((i, idx) => (
                <tr key={i.id} data-testid={`weight-rank-${i.id}`} className="border-t border-line">
                  <td className="px-1 py-1.5 font-mono text-ink-3">{idx + 1}</td>
                  <td className="px-1 py-1.5">{i.title}</td>
                  <td className="px-1 py-1.5">
                    <b className="font-mono">{totalOf(i.id)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ApplySection>
    </Card>
  );
}
