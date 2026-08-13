import type { Cfg, CxmData } from "../../data/schema/index.ts";
import { flowHasSourceCitation, flowStepsCopied, sourceHealth } from "../../domain/index.ts";
import { Card } from "../../design-system/index.ts";

/* HAI tình trạng còn lại phải trưng — module-i-signal-registry-charter.md §6, §14 lát I5.

   ⚠️ Bản đầu của lát này hiện cả năm dòng T1·T3·T4·T5·T7 ở đây. SAI, đã cắt: **T4, T5, T7 ĐÃ hiện ở
   khối ① phía trên** (`SignalInventoryBlock.tsx`, các dòng `inv-steps-nested` / `inv-signal-no-metric`
   / `inv-metric-no-signal`) — cùng hàm domain, cùng mẫu số, cùng câu chữ. Trưng một tình trạng hai
   lần trên CÙNG một màn chính là lý do §6 đã gạch T2, T6, T8; tái lập nó ở khối mới thì module này
   tự phá luật của mình. Số không lệch được (chung hàm) nên đây không phải bug số — nó là bug đọc:
   người xem đếm hai lần một chuyện. "Phải thấy được" là yêu cầu về MÀN, không phải về KHỐI.

   Còn lại đúng T1 và T3 — hai tình trạng không khối nào khác nói: cả hai đều là *bản khai không khớp
   thực tế*, khác hẳn phép kiểm kê của khối ① ("① Kiểm kê điểm đo").

   T1/F6 — "chưa đánh giá được" KHÔNG vào mẫu số của T1 (bất biến 2: không trộn *chưa-biết* với
   *thiếu*). Một flow chưa trích dẫn sơ đồ nguồn VÀ chưa chép bước là CHƯA CÓ THÔNG TIN NÀO để xếp
   loại — khác hẳn flow ĐÃ trích dẫn mà chưa chép bước (T1: biết chắc là thiếu bước). Gộp chung một
   mẫu số thì thêm một flow vừa map (chưa kịp làm gì cả) sẽ pha loãng tỉ lệ T1 dù chẳng có gì đổi.
   Đếm tách riêng, hiện cạnh T1 bằng chính testid của nó (không phải dòng thứ sáu) — test F6 thêm
   một flow trống vào BẢN SAO dữ liệu: N/M của T1 không đổi, chỉ số đếm này tăng đúng 1. */
export function SignalGovernanceBlock({ data, cfg }: { data: CxmData; cfg: Cfg }) {
  const evaluated = data.flows.filter((f) => flowHasSourceCitation(f) || flowStepsCopied(f, data.steps));
  const notEvaluated = data.flows.length - evaluated.length;
  const citedNotCopied = evaluated.filter(
    (f) => flowHasSourceCitation(f) && !flowStepsCopied(f, data.steps),
  );

  // T3 — "đã ngừng gửi" = sourceHealth 'down' (khác 'stale'/'silent': hai hạng đó là *chưa-biết*
  // hoặc *đang trễ*, chưa phải kết luận đứt hẳn — luật không trộn chưa-biết với thiếu).
  const brokenFeeding = data.sources.filter(
    (s) => sourceHealth(s, cfg, data.asOf) === "down" && s.metrics.length > 0,
  );

  return (
    <Card title="Bản khai không khớp thực tế">
      {/* Hai dòng cách nhau bằng một vạch chứ chỉ bằng khoảng trắng: khối này đứng ở cột hẹp nên mỗi
          dòng tự xuống hai-ba dòng chữ, và khi đó khoảng cách giữa hai mục không còn phân biệt được
          với khoảng cách giữa hai dòng trong cùng một mục. */}
      <ul className="flex flex-col gap-3 text-[13px]">
        <li data-testid="gov-t1">
          <b className="tabular-nums">
            {citedNotCopied.length} / {evaluated.length}
          </b>{" "}
          flow đã trích dẫn sơ đồ nguồn mà chưa chép bước
          <span className="t-meta" data-testid="gov-t1-not-evaluated">
            {" — "}
            {/* luật 12/08: bỏ đuôi ", không tính vào mẫu số trên" — cơ sở đếm, không phải dữ liệu */}
            <b className="tabular-nums">{notEvaluated}</b> flow chưa đánh giá được (chưa trích dẫn
            sơ đồ, cũng chưa chép bước)
          </span>
        </li>
        <li data-testid="gov-t3" className="border-t border-line-soft pt-3">
          <b className="tabular-nums">
            {brokenFeeding.length} / {data.sources.length}
          </b>{" "}
          nguồn đã ngừng gửi mà vẫn khai nuôi ít nhất một chỉ số
        </li>
      </ul>
    </Card>
  );
}
