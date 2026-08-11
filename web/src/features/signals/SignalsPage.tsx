import { useState } from "react";
import { PageTitle } from "../../nav.tsx";
import { Note } from "../../design-system/index.ts";
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

   Bất biến 9 (charter §9) — màn KHÔNG khai độ phủ so với thực tế: dữ liệu chỉ đến từ một nguồn ghi
   duy nhất nên "đo được bao nhiêu % của thực tế" KHÔNG TỒN TẠI, không phải "chưa tính được". Câu
   giới hạn phải IN RA màn, đặt TRƯỚC khi người đọc thấy số — không phải chú thích chân trang, để
   lần sau ai muốn thêm lại một cột "% độ phủ" phải xoá câu này trước (quyết định có chủ ý, không
   phải tai nạn).

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

      <div className="mb-5" data-testid="signals-scope-note">
        <Note tone="bd">
          Màn này không nói được đang đo bao nhiêu phần của thực tế. Dữ liệu chỉ đến từ một nguồn
          ghi duy nhất, nên không có gì để so. Mọi số ở đây là về cái đã nhận được.
        </Note>
      </div>

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
