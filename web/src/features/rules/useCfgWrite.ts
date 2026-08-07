import { useState } from "react";
import type { Cfg } from "../../data/schema/index.ts";
import { useCxmStore } from "../../store/store.ts";

/* Ghi cfg từ một nhóm của màn "Chỉ số & ngưỡng", kèm chỗ hiện lý do khi bị chặn.

   VÌ SAO MỖI NHÓM GIỮ LỖI CỦA RIÊNG MÌNH thay vì một ô lỗi chung ở đầu màn: `setCfg` NÉM khi cấu
   hình mới làm phát sinh lỗi bất biến (mock-repository.ts:156-164), và câu ném ra nói về đúng ô vừa
   sửa. Đẩy nó lên đầu màn là bắt người dùng tự dò xem câu đó nói về ô nào trong bảy nhóm.

   VÌ SAO VẪN PHẢI try/catch DÙ NHÓM ĐÃ TỰ KIỂM TRƯỚC: luật ở `data/validate.ts` rộng hơn phần UI
   kiểm được — ví dụ luật "hai dải khác nhau không được ra cùng một nhãn" (thêm ở review Module E
   section 1) chỉ lộ ra sau khi sinh nhãn cho toàn bộ trục. UI không được giả vờ mình biết hết luật;
   nó kiểm những gì nói được thành câu cho người dùng, còn lại để seam ghi chặn và in nguyên văn. */
export function useCfgWrite() {
  const setCfg = useCxmStore((s) => s.setCfg);
  const [error, setError] = useState<string | null>(null);

  /** Ghi một phần cfg. Trả `true` nếu ghi được. Bị chặn thì state cũ giữ nguyên và `error` có câu
      nguyên văn từ seam ghi — KHÔNG nuốt lỗi, vì một ô cấu hình lặng lẽ không đổi là chỗ người vận
      hành tin là mình đã sửa xong trong khi chưa. */
  const write = (patch: Partial<Cfg>): boolean => {
    try {
      setCfg(patch);
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  return { write, error, clearError: () => setError(null) };
}
