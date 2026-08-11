import { useState } from "react";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { SignalInventoryBlock } from "./SignalInventoryBlock.tsx";
import { SignalReliabilityBlock } from "./SignalReliabilityBlock.tsx";
import { SignalGovernanceBlock } from "./SignalGovernanceBlock.tsx";
import { SignalTable } from "./SignalTable.tsx";
import { SignalProfile } from "./SignalProfile.tsx";

/* #/signals — màn Điểm đo (module-i-signal-registry-charter.md §2, §14 lát I4a). Phần KIỂM KÊ toàn
   hệ: hôm nay muốn xem MỘT điểm đo phải vào #/atlas → chọn phase → flow → bước → mở tab — phải BIẾT
   TRƯỚC cần bước nào. Màn này trả lời ở mức TOÀN HỆ: hệ đang đo những gì, cái nào chưa chạy, cái nào
   không dùng vào việc gì. Hồ sơ chi tiết một điểm đo ở I4b (SignalProfile.tsx), chart giá trị + khối
   bản-khai-không-khớp ở I5 (SignalProfile.tsx mặt 4 · SignalGovernanceBlock.tsx).

   Năm tình trạng charter §6 buộc trưng nằm ở HAI khối, không một: T4·T5·T7 ở khối ① phía trên
   (kiểm kê), T1·T3 ở khối sau bảng (bản khai lệch thực tế). Đừng dồn cả năm vào một khối cho "gọn" —
   làm thế là hiện T4/T5/T7 hai lần trên cùng màn, đúng bug đã cắt ở I5.

   Bất biến 9 (charter §9 mục 9) có HAI vế. Vế 1 CÒN NGUYÊN: màn KHÔNG khai độ phủ so với thực tế —
   dữ liệu chỉ đến từ một nguồn ghi duy nhất nên "đo được bao nhiêu % của thực tế" KHÔNG TỒN TẠI,
   không phải "chưa tính được", và màn không được có cột/tỉ lệ nào lấy "thực tế" làm mẫu số. Vế 2
   (câu giới hạn phải IN RA màn) đã bị owner GỠ 11/08 theo luật giao diện chung — xem
   `docs/DB-FIRST-HANDOFF.md` §"App hiển thị dữ liệu, không luận giải" và charter §9 mục 9 — nên câu
   giới hạn không còn in trên màn (xem chỗ bỏ ngay dưới `PageTitle`); hàng rào còn lại chỉ là vế 1
   cộng văn bản charter, không còn hàng rào nào trên màn.

   Lát I4b: bấm một dòng ở bảng mở hồ sơ MỘT điểm đo (SignalProfile.tsx, bốn mặt của QĐ 9) — state
   local `selectedSignalId` (cùng khuôn AtlasPage.tsx: lựa chọn nào cũng là state của MÀN, không
   phải của store). Mở hồ sơ thì THAY hẳn hai khối kiểm kê + bảng, không xếp chồng — khớp bố cục
   "MÀN 2" của output/ascii-man-diem-do.txt. Đóng hồ sơ (nút "← Điểm đo") quay lại đúng bảng cũ. */
export type SignalsPageProps = {
  /** Store hook injectable (precedent OverviewPage) — test cần dựng store riêng với `seed` (7 khách,
      sigCounts rỗng) để kiểm nhánh (a) của Khối ②, khác singleton (demoData, luôn có sigCounts). */
  useStore?: typeof useCxmStore;
};

export function SignalsPage({ useStore = useCxmStore }: SignalsPageProps) {
  const data = useStore((s) => s.data);
  const dims = useStore((s) => s.dims);
  const cfg = useStore((s) => s.cfg);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const selectedSignal = selectedSignalId ? data.signals.find((s) => s.id === selectedSignalId) : undefined;

  return (
    <div className="p-8">
      <PageTitle route="signals" />

      {data.asOf ? (
        <p className="text-[12px] text-ink-3 mb-3" data-testid="signals-asof">
          Số liệu tính đến {data.asOf}
        </p>
      ) : null}

      {/* luật 11/08 (bổ sung, ghi đè bất biến 9 charter Module I theo owner 11/08): bỏ câu giới hạn đầu màn */}

      {selectedSignal ? (
        <SignalProfile data={data} signal={selectedSignal} onBack={() => setSelectedSignalId(null)} dims={dims} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 items-start mb-6">
            <SignalInventoryBlock data={data} />
            <SignalReliabilityBlock data={data} dims={dims} />
          </div>

          <SignalTable data={data} onSelect={setSelectedSignalId} />

          <div className="mt-4">
            <SignalGovernanceBlock data={data} cfg={cfg} />
          </div>
        </>
      )}
    </div>
  );
}
