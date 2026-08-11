import { Card, Note } from "../../../design-system/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 5 — Bản tin định kỳ. Port tinh thần V.rules nhánh g==='sub' (prototype dòng 4278-4301): ai
   nhận bảng nào, tần suất nào, gửi qua đâu. Số dòng SINH từ `data.dash`, không gõ tay id/tên set nào.

   TẦN SUẤT 'off' KHOÁ Ô KÊNH — đúng prototype (`disabled` khi `CFG.sub[d.id].f === 'off'`): chọn
   kênh cho một bản tin không gửi là một lựa chọn vô nghĩa, và để ô đó bấm được là mời người dùng
   tưởng nó có tác dụng.

   TẬP KÊNH `SUB_CH` — `CfgSub.ch` trong schema (`data/schema/config.ts`) khai là `string` trần,
   KHÔNG có union đóng nào để lấy lại trong code thật. Lấy đúng ba giá trị literal của prototype
   (dòng 1365: `SUB_CH = ['Email', 'Slack', 'Email + Slack']`) — đối chiếu `data/fixtures/seed.ts:
   972-979`, cả sáu entry `cfg.sub` hôm nay đều nằm trong đúng ba giá trị này, nên dùng an toàn cho
   bản demo. Owner đổi tập kênh thật thì chỉ cần sửa hằng số này. */
const SUB_CH = ["Email", "Slack", "Email + Slack"];

const FREQ: readonly [string, string][] = [
  ["off", "Không gửi"],
  ["daily", "Hằng ngày"],
  ["weekly", "Hằng tuần"],
  ["monthly", "Hằng tháng"],
];
const FREQ_LABEL: Record<string, string> = Object.fromEntries(FREQ);

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function SubGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();

  const on = data.dash.filter((d) => cfg.sub[d.id]?.f !== "off");

  return (
    <Card title="Bản tin định kỳ">
      {error ? (
        <div className="mb-3">
          <Note tone="crit">
            <b>Không ghi được cấu hình.</b> {error}
          </Note>
        </div>
      ) : null}

      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className={TH}>Bảng</th>
            <th className={TH}>Vai nhận</th>
            <th className={TH}>Tần suất</th>
            <th className={TH}>Kênh</th>
          </tr>
        </thead>
        <tbody>
          {data.dash.map((d) => {
            const c = cfg.sub[d.id];
            // Phòng thủ: validate.ts buộc mỗi set trong `dash` phải có đúng một entry `cfg.sub`
            // (mock-repository.ts tạo/xoá entry cùng lúc với set), nên nhánh này không nên xảy ra
            // trên dữ liệu hợp lệ — nhưng không giả định store luôn sạch trước khi màn kịp render.
            if (!c) return null;
            return (
              <tr key={d.id} data-testid={`sub-row-${d.id}`} className="border-t border-line">
                <td className="px-1 py-1.5">
                  <b className="text-[13.5px]">{d.name}</b>
                  <div className="t-meta mt-0.5 text-[11.5px]">{d.desc}</div>
                </td>
                <td className="t-meta px-1 py-1.5">{d.role}</td>
                <td className="px-1 py-1.5">
                  <select
                    aria-label={`Tần suất bản tin ${d.name}`}
                    value={c.f}
                    onChange={(e) => write({ sub: { ...cfg.sub, [d.id]: { ...c, f: e.target.value } } })}
                    className="rounded-lg border border-line bg-surface px-2 py-1 text-[12.5px] text-ink"
                  >
                    {FREQ.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1.5">
                  <select
                    aria-label={`Kênh gửi bản tin ${d.name}`}
                    value={c.ch}
                    disabled={c.f === "off"}
                    onChange={(e) => write({ sub: { ...cfg.sub, [d.id]: { ...c, ch: e.target.value } } })}
                    className="rounded-lg border border-line bg-surface px-2 py-1 text-[12.5px] text-ink disabled:opacity-45"
                  >
                    {SUB_CH.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 border-t border-line pt-4">
        <div className="t-lbl mb-2">Áp ngay lúc này</div>
        <Note tone={on.length ? "default" : "warn"}>
          {on.length ? (
            <>
              <b>{on.length} bản tin đang bật:</b>{" "}
              {on
                .map((d) => `${d.name} ${FREQ_LABEL[cfg.sub[d.id].f]} qua ${cfg.sub[d.id].ch}`)
                .join(" · ")}
              .
            </>
          ) : (
            <>
              <b>Không có bản tin nào đang bật.</b> Không ai nhận được gì nếu không tự vào xem.
            </>
          )}
        </Note>
      </div>
    </Card>
  );
}
