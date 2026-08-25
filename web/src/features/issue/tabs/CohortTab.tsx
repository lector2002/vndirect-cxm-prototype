import type { CxmData, Issue, Loop, SegUnknown } from "../../../data/schema/index.ts";
import type { IssueScore } from "../../../data/priority.ts";
import { Badge, Note, Stat } from "../../../design-system/index.ts";
import { nf } from "../../../design-system/format.ts";

/* Tab Cohort — port V.issue nhánh 'cust' (prototype dòng 3306-3330) + quyết định #5 owner 07/08:
   5 cột prototype + 4 cột phân khúc (tuổi · NAV · thâm niên · kênh mở TK).

   Câu rào đầu tab KHÔNG được bỏ (charter B5): nó là thứ làm cho việc hiện 4 dòng thật cạnh
   "trên tổng N khách" là trung thực — cohort để khép vòng, không phải màn tra cứu khách.

   Nhãn dải tuổi/NAV đọc từ `Customer.bands` — data/projectBands.ts điền qua bandLabels() (bất biến
   4), màn không tự cắt. `tenure` đã RÚT khỏi cfg.segment.band từ 04/08 nên KHÔNG còn dải — cột
   thâm niên in SỐ THÔ `tenureMonths` (dữ kiện thật vẫn giữ trên Customer), không bịa lại một bộ
   ranh giới đã xoá. Sentinel 'chưa-biết'/'thiếu' đi qua nguyên vẹn và hiện KHÁC nhau (bất biến 3).

   Mẫu số "trên tổng ... khách bị ảnh hưởng": aff đo qua issueScore (nullable) — null in rõ
   "chưa đếm được tổng", không im lặng bỏ mẫu số (bất biến 8). */

const TIER_LABEL: Record<string, string> = { "high-value": "High-value", new: "Khách mới", standard: "Thường" };

const SENTINELS: ReadonlySet<string> = new Set<SegUnknown>(["chưa-biết", "thiếu"]);

/** In một ô có thể mang sentinel: giá trị thật in thường, sentinel in mờ + đúng nguyên văn. */
function cell(v: string): { text: string; dim: boolean } {
  return { text: v, dim: SENTINELS.has(v) };
}

export type CohortTabProps = {
  issue: Issue;
  score: IssueScore;
  loop: Loop | undefined;
  data: CxmData;
};

export function CohortTab({ issue, score, loop, data }: CohortTabProps) {
  const cs = issue.cust.map((k) => data.cust.find((c) => c.key === k)).filter((c) => c !== undefined);
  const aff = score.x.aff;
  const denom = aff === null ? "tổng khách bị ảnh hưởng chưa đếm được (chưa map sigMap)" : `trên tổng ${nf(aff)} khách bị ảnh hưởng`;

  if (cs.length === 0) {
    return (
      <div data-testid="issue-cohort-empty">
        <Note>
          <Badge state="unknown" /> <b>Chưa lập được cohort khách bị ảnh hưởng.</b>{" "}
          {issue.ev.length === 0
            ? "Điểm gãy này là lỗi ở hệ thống thu thập dữ liệu, không gắn với khách hàng cụ thể nào."
            : "Điểm gãy này hiện chỉ có tín hiệu hành vi, chưa nối được sang định danh khách. Cần bổ sung tín hiệu có khóa khách trước khi có thể khép vòng."}
        </Note>
      </div>
    );
  }

  return (
    <div>
      <Note>
        <b>Đây là cohort để khép vòng, không phải màn tra cứu khách hàng.</b> Hồ sơ, tài khoản và lịch sử của
        từng khách nằm ở CRM / Customer 360 — CXM chỉ giữ đủ để biết <i>ai bị ảnh hưởng</i> và{" "}
        <i>đã liên hệ chưa</i>. Toàn bộ định danh đã pseudonymize: không tên, CCCD, số điện thoại hay email.
      </Note>

      <div className="grid grid-cols-3 gap-3 my-4">
        <Stat label="Khách trong cohort mẫu" value={String(cs.length)} foot={denom} srcNote="Đã pseudonymize" />
        <Stat
          label="Nhóm giá trị cao"
          value={String(cs.filter((c) => c.tier === "high-value").length)}
          foot="cần ưu tiên khi liên hệ"
          srcNote="CRM valueTier"
        />
        <Stat
          label="Cần liên hệ khép vòng"
          value={loop ? nf(loop.need) : "—"}
          foot={loop ? `đã liên hệ ${nf(loop.done)} · kênh ${loop.ch}` : "chưa lập danh sách"}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]" data-testid="issue-cohort-table">
          <thead>
            <tr className="text-left t-lbl border-b border-line">
              <th className="py-2 pr-3">Khóa khách</th>
              <th className="py-2 pr-3">Segment</th>
              <th className="py-2 pr-3">Nhóm giá trị</th>
              <th className="py-2 pr-3">Platform</th>
              <th className="py-2 pr-3">Trạng thái hiện tại</th>
              <th className="py-2 pr-3">Tuổi</th>
              <th className="py-2 pr-3">NAV</th>
              <th className="py-2 pr-3">Thâm niên</th>
              <th className="py-2">Kênh mở TK</th>
            </tr>
          </thead>
          <tbody>
            {cs.map((c) => {
              const age = cell(String(c.bands["age"] ?? "thiếu"));
              const nav = cell(String(c.bands["nav"] ?? "thiếu"));
              const tenure =
                typeof c.tenureMonths === "number" ? { text: `${c.tenureMonths} tháng`, dim: false } : cell(c.tenureMonths);
              const acq = cell(c.acq);
              return (
                <tr key={c.key} className="border-b border-line/60">
                  <td className="py-2 pr-3 font-mono text-[12.5px] font-semibold">{c.key}</td>
                  <td className="py-2 pr-3 text-ink-2">{c.seg}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border ${
                        c.tier === "high-value" ? "border-primary text-primary bg-surface" : "border-line bg-surface-2 text-ink-2"
                      }`}
                    >
                      {TIER_LABEL[c.tier] ?? c.tier}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-ink-2">{c.pf}</td>
                  <td className="py-2 pr-3">{c.st}</td>
                  <td className={`py-2 pr-3 ${age.dim ? "text-ink-3 italic" : ""}`}>{age.text}</td>
                  <td className={`py-2 pr-3 ${nav.dim ? "text-ink-3 italic" : ""}`}>{nav.text}</td>
                  <td className={`py-2 pr-3 ${tenure.dim ? "text-ink-3 italic" : ""}`}>{tenure.text}</td>
                  <td className={`py-2 ${acq.dim ? "text-ink-3 italic" : ""}`}>{acq.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
