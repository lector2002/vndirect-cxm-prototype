import type { Cfg, CxmData } from "../data/schema/index.ts";
import { metricDirection } from "../data/metric-direction.ts";

/* Soi cfg đang đặt NGƯỢC NHAU — vẫn chạy được (metricState/stepState không ném), nhưng nhãn trạng
   thái sinh ra sẽ vô nghĩa (vd. "watch" hiện ra khi lẽ ra phải là "crit" nặng hơn, hoặc ngược lại).
   Đây là lưới an toàn cho màn Chỉ số & ngưỡng — không phải luật validate cứng (setCfg vẫn CHO ghi
   cfg kiểu này, vì nó không vỡ bất biến dữ liệu nào), chỉ là cảnh báo để owner tự sửa.
   Port 1-1 cfgIssues() của prototype (output/cxm-platform-prototype.html:4333-4346, ở NGOÀI web/ —
   nằm cạnh web/ chứ không phải web/output/). Câu chữ giữ nguyên bản gốc; khác đúng một chỗ: bản gốc
   `const c = CFG.metric[m.id]; if (!c.on) return;` sẽ NÉM nếu chỉ số thiếu entry (đọc `.on` trên
   undefined) — Cfg.metric hôm nay không còn đảm bảo phủ đủ mọi chỉ số (module thêm chỉ số không kèm
   band ngay), nên hàm thuần này thêm `if (!band || !band.on) continue;`, bỏ qua thay vì ném.

   Hướng so sánh của từng chỉ số lấy từ metricDirection() (data/metric-direction.ts, tương đương
   mdir() của prototype) — dùng lại ĐÚNG luật mà metricState() đang dùng để xếp hạng, không tự suy
   luận hướng riêng ở đây kẻo hai nơi lệch nhau theo thời gian. */
export function cfgIssues(data: CxmData, cfg: Cfg): string[] {
  const issues: string[] = [];

  if (cfg.step.failCrit <= cfg.step.failWatch) {
    issues.push(
      `Bước: ngưỡng cần xử lý (${cfg.step.failCrit}%) phải cao hơn ngưỡng cần theo dõi (${cfg.step.failWatch}%).`,
    );
  }

  for (const m of data.metrics) {
    const band = cfg.metric[m.id];
    if (!band || !band.on) continue;
    const dir = metricDirection(m);
    if (dir === "down" && band.crit <= band.watch) {
      issues.push(
        `${m.name}: mục tiêu là càng thấp càng tốt, nên ngưỡng cần xử lý (${band.crit}) phải cao hơn ngưỡng cần theo dõi (${band.watch}).`,
      );
    } else if (dir === "up" && band.crit >= band.watch) {
      issues.push(
        `${m.name}: mục tiêu là càng cao càng tốt, nên ngưỡng cần xử lý (${band.crit}) phải thấp hơn ngưỡng cần theo dõi (${band.watch}).`,
      );
    }
  }

  return issues;
}
