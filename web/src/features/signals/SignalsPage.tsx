import { PageTitle } from "../../nav.tsx";
import { Note } from "../../design-system/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { SignalInventoryBlock } from "./SignalInventoryBlock.tsx";
import { SignalReliabilityBlock } from "./SignalReliabilityBlock.tsx";
import { SignalTable } from "./SignalTable.tsx";

/* #/signals — màn Điểm đo (module-i-signal-registry-charter.md §2, §14 lát I4a). Phần KIỂM KÊ toàn
   hệ: hôm nay muốn xem MỘT điểm đo phải vào #/atlas → chọn phase → flow → bước → mở tab — phải BIẾT
   TRƯỚC cần bước nào. Màn này trả lời ở mức TOÀN HỆ: hệ đang đo những gì, cái nào chưa chạy, cái nào
   không dùng vào việc gì. KHÔNG làm hồ sơ chi tiết một điểm đo (I4b) và KHÔNG làm chart giá trị (I5).

   Bất biến 9 (charter §9) — màn KHÔNG khai độ phủ so với thực tế: dữ liệu chỉ đến từ một nguồn ghi
   duy nhất nên "đo được bao nhiêu % của thực tế" KHÔNG TỒN TẠI, không phải "chưa tính được". Câu
   giới hạn phải IN RA màn, đặt TRƯỚC khi người đọc thấy số — không phải chú thích chân trang, để
   lần sau ai muốn thêm lại một cột "% độ phủ" phải xoá câu này trước (quyết định có chủ ý, không
   phải tai nạn). */
export type SignalsPageProps = {
  /** Store hook injectable (precedent OverviewPage) — test cần dựng store riêng với `seed` (7 khách,
      sigCounts rỗng) để kiểm nhánh (a) của Khối ②, khác singleton (demoData, luôn có sigCounts). */
  useStore?: typeof useCxmStore;
};

export function SignalsPage({ useStore = useCxmStore }: SignalsPageProps) {
  const data = useStore((s) => s.data);
  const dims = useStore((s) => s.dims);

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

      <div className="grid grid-cols-2 gap-4 items-start mb-6">
        <SignalInventoryBlock data={data} />
        <SignalReliabilityBlock data={data} dims={dims} />
      </div>

      <SignalTable data={data} />
    </div>
  );
}
