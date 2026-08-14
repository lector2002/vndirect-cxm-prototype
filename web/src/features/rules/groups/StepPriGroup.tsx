import { Card, Note } from "../../../design-system/index.ts";
import { PRI_LABEL } from "../../../data/priority.ts";
import type { StepLevel } from "../../../data/schema/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm "Mức của từng bước" — `cfg.step.jc` + `cfg.step.reg` (ADR-002 §5, §6).

   Đây là chỗ hai khoá `jc` (mức quan trọng của bước) và `reg` (rủi ro pháp lý) BẮT ĐẦU CÓ NGHĨA.
   Trước 14/08 `createIssue` gán `jc = 14` cho MỌI bước, tức khoá đó chưa phân biệt được bước nào
   với bước nào; `reg` thì gõ tay theo từng điểm gãy. Cả hai nay là thuộc tính của BƯỚC, khai một
   lần, mọi điểm gãy trên cùng bước thừa hưởng — không có đường cho hai chỗ lệch nhau.

   BỎ TRỐNG LÀ MỘT CÂU TRẢ LỜI HỢP LỆ, và là mặc định: bước chưa chọn mức ⇒ khoá đó *chưa tính
   được* cho mọi điểm gãy trên bước (§9), KHÔNG rơi về một mức giữa. Một mặc định là phán đoán trá
   hình — "bước này quan trọng vừa" là câu khẳng định, không phải chỗ trống.

   Hai cột cùng một bảng chứ không hai nhóm: chúng cùng hình dạng, cùng đơn vị khai, và người điền
   đi qua danh sách bước ĐÚNG MỘT LẦN thay vì hai lần. */

const LEVELS: { v: StepLevel; l: string }[] = [
  { v: "low", l: "Thấp" },
  { v: "mid", l: "Vừa" },
  { v: "high", l: "Cao" },
];

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";
const SEL = "w-full border border-line rounded px-2 py-1 text-[12.5px] bg-surface";

export function StepPriGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();

  /* Ghi TỪNG Ô một, khác nhóm Trọng số (nháp rồi lưu cả bảy): ở đây các ô độc lập, không có ràng
     buộc tổng nào giữa chúng, nên mỗi lựa chọn tự nó đã là một cấu hình hợp lệ. Bắt người dùng bấm
     "Lưu" sau 48 lần chọn là dựng một cái cửa không canh gì. */
  const setLevel = (field: "jc" | "reg", stepId: string) => (v: string) => {
    const next: Record<string, StepLevel> = { ...cfg.step[field] };
    if (v === "") delete next[stepId];
    else next[stepId] = v as StepLevel;
    write({ step: { ...cfg.step, [field]: next } });
  };

  const filled = (field: "jc" | "reg") =>
    data.steps.filter((s) => cfg.step[field][s.id] !== undefined).length;

  return (
    <Card title="Mức của từng bước">
      {error ? (
        <div className="mb-3" data-testid="steppri-write-error">
          <Note tone="crit">
            <b>Không ghi được.</b> {error}
          </Note>
        </div>
      ) : null}

      {/* Đếm ra chữ phần CHƯA điền — nó là việc còn phải làm, và cùng con số quyết định điểm gãy
          nào lên được khối xếp hạng ở #/work. Không có câu này thì một bảng 30 dòng toàn ô trống
          trông như một bảng bình thường. */}
      <div className="mb-3" data-testid="steppri-progress">
        <Note>
          {`Đã điền ${filled("jc")}/${data.steps.length} bước cho ${PRI_LABEL.jc.toLowerCase()}, ` +
            `${filled("reg")}/${data.steps.length} cho ${PRI_LABEL.reg.toLowerCase()}. ` +
            `Bước bỏ trống thì khoá đó chưa tính được, không rơi về mức nào.`}
        </Note>
      </div>

      <div className="max-h-[520px] overflow-y-auto pr-1">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className={TH}>Bước</th>
              <th className={TH}>{PRI_LABEL.jc}</th>
              <th className={TH}>{PRI_LABEL.reg}</th>
            </tr>
          </thead>
          <tbody>
            {data.steps.map((s) => (
              <tr key={s.id} data-testid={`steppri-row-${s.id}`} className="border-t border-line">
                <td className="px-1 py-1.5 min-w-0">
                  <span className="font-mono text-[12px] text-ink-3">{s.code}</span>{" "}
                  <b className="text-[13px]">{s.name}</b>
                </td>
                {(["jc", "reg"] as const).map((field) => (
                  <td key={field} className="px-1 py-1.5 w-[130px]">
                    <label className="sr-only" htmlFor={`steppri-${field}-${s.id}`}>
                      {`${PRI_LABEL[field]} của bước ${s.code}`}
                    </label>
                    <select
                      id={`steppri-${field}-${s.id}`}
                      className={SEL}
                      value={cfg.step[field][s.id] ?? ""}
                      onChange={(e) => setLevel(field, s.id)(e.target.value)}
                    >
                      <option value="">— chưa chọn —</option>
                      {LEVELS.map((L) => (
                        <option key={L.v} value={L.v}>
                          {L.l}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
