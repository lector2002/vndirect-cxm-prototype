import { Badge, Card, Note } from "../../../design-system/index.ts";
import { lagText, sourceHealth } from "../../../domain/index.ts";
import type { SourceHealth } from "../../../domain/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 3 — "SLA từng nguồn" (`cfg.source[id]`, một bảng). Port tinh thần `g === 'source'` của
   prototype (dòng 4207-4229), không port HTML thô.

   BẢN TẠM (charter mục "Nhóm 3 là BẢN TẠM"): danh sách nguồn chưa chốt (owner 06/08, cùng lứa với
   màn Nguồn dữ liệu). Ràng buộc bắt buộc: SỐ DÒNG SINH TỪ `data.sources`, không gõ tay id nguồn nào
   ở bất cứ đâu trong file này — chốt kiểm kê xong thì bảng tự đổi mà không cần sửa code ở đây. */

/* 07/08 (module-i-signal-registry-charter.md I3): "silent" thêm vào SourceHealth — chấm sức khoẻ
   giờ theo `asOf` (domain/state.ts), KHÔNG còn đọc `cfg.source[id]` — cột "SLA cho phép" dưới đây
   thành control MỒ CÔI, giống `cfg.step.covMin` sau I1 (vẫn sửa được, không còn đổi được nhãn cột
   "Trạng thái suy ra"). Thêm nhánh "silent" ở đây CHỈ để hai Record còn EXHAUSTIVE — không nguồn nào
   trong fixture hôm nay rơi vào nhánh đó. */
const HEALTH_LABEL: Record<SourceHealth, string> = {
  ok: "Đang nhận",
  stale: "Thiếu ngày dữ liệu",
  down: "Ngừng gửi",
  silent: "Im lặng, chưa phân định",
};
const HEALTH_BADGE: Record<SourceHealth, "ok" | "watch" | "crit" | "unknown"> = {
  ok: "ok",
  stale: "watch",
  down: "crit",
  silent: "unknown",
};

/** Style tiêu đề cột dùng chung — tránh chép cùng một chuỗi class 6 lần (khuôn SourcesPage.tsx). */
const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function SourceGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();

  const badCount = data.sources.filter((s) => sourceHealth(s, cfg, data.asOf) !== "ok").length;

  return (
    <Card
      title="SLA độ tươi từng nguồn"
      denomStrip={`${data.sources.length} nguồn`}
    >
      <div className="mb-3.5">
        <Note>
          {/* luật 11/08: bỏ "Chốt xong bảng này tự đổi theo, không cần sửa lại màn." */}
          <b>Bản tạm.</b> Danh sách nguồn dưới đây sinh thẳng từ dữ liệu đang có, cùng lứa với màn{" "}
          <a href="#/sources">Nguồn dữ liệu</a> — kiểm kê nguồn của ngân hàng chưa chốt (06/08/2026).
        </Note>
      </div>

      {error ? (
        <div className="mb-3" data-testid="source-write-error">
          <Note tone="crit">
            <b>Không ghi được.</b> {error}
          </Note>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        {/* Sàn bề rộng rồi mới cuộn ngang — cùng lý do đã ghi ở MetricGroup: không có sàn thì sáu
            cột bị bóp, tiêu đề cột tụt xuống ba dòng và cột tên nguồn co lại còn vài chữ. */}
        <table
          className="w-full min-w-[820px] border-collapse text-[12.5px]"
          data-testid="source-table"
        >
          <thead>
            <tr className="border-b border-line">
              <th className={TH}>Nguồn</th>
              <th className={TH}>Loại</th>
              <th className={TH}>Độ trễ hiện tại</th>
              <th className={TH}>SLA cho phép</th>
              <th className={TH}>Trạng thái suy ra</th>
              <th className={TH}>Chỉ số bị ảnh hưởng nếu nguồn sai</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.map((s) => {
              const h = sourceHealth(s, cfg, data.asOf);
              // Nguồn mới chưa có SLA riêng trong cfg (kiểm kê mở thêm nguồn) không được để ô nhập
              // hiện "undefined" — dùng đúng SLA nền 6 giờ mà `sourceHealth()` (domain/state.ts) đã
              // tự áp khi thiếu cấu hình, để ô nhập và badge không nói khác nhau ngay lần hiện đầu.
              const sla = cfg.source[s.id] ?? 6;
              return (
                <tr key={s.id} data-testid={`rules-source-row-${s.id}`} className="border-t border-line">
                  <td className="py-1.5 px-1">
                    <b className="text-[13.5px]">{s.name}</b>
                  </td>
                  <td className="py-1.5 px-1 t-meta">{s.kind}</td>
                  <td className="py-1.5 px-1">
                    <b className={h === "ok" ? "text-ink" : "text-crit"}>{lagText(s.lagH)}</b>
                  </td>
                  <td className="py-1.5 px-1 w-[150px]">
                    <NumField
                      value={sla}
                      onCommit={(v) => write({ source: { ...cfg.source, [s.id]: v } })}
                      suffix="giờ"
                      label={`SLA ${s.name}`}
                    />
                  </td>
                  <td className="py-1.5 px-1 whitespace-nowrap">
                    <Badge state={HEALTH_BADGE[h]} text={HEALTH_LABEL[h]} />
                  </td>
                  <td className="py-1.5 px-1">
                    {s.metrics.length ? (
                      s.metrics.map((mId) => (
                        <span
                          key={mId}
                          className="inline-block px-2 py-0.5 rounded-[6px] text-[12px] font-semibold border border-line bg-surface-2 mr-1 mb-1"
                        >
                          {data.metrics.find((m) => m.id === mId)?.name ?? mId}
                        </span>
                      ))
                    ) : (
                      <span className="t-meta">không nối chỉ số nào</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3.5">
        <Note tone={badCount ? "crit" : "default"}>
          <b>
            {badCount} trong {data.sources.length} nguồn không ở trạng thái "Đang nhận".
          </b>
          <div className="mt-2">
            07/08: cách chấm đổi sang so ngày nhận dữ liệu với mốc số liệu, không còn so giờ trễ với
            SLA — sửa ô "SLA cho phép" ở đây <b>không còn đổi được</b> nhãn ở cột "Trạng thái suy ra".
            Ô này giữ lại để ghi nhịp giao dự kiến của từng nguồn, không còn cầm quyền quyết định sức
            khoẻ nguồn.
          </div>
        </Note>
      </div>
    </Card>
  );
}
