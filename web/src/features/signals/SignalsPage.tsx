import { useMemo, useState } from "react";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { SignalInventoryBlock } from "./SignalInventoryBlock.tsx";
import { SignalTable } from "./SignalTable.tsx";
import { SignalProfile } from "./SignalProfile.tsx";
import { SignalDrawer } from "./SignalDrawer.tsx";
import {
  EMPTY_SIGNAL_FILTER,
  groupSignalsByPhase,
  matchedSignalIds,
  orderedSignals,
  type SignalFilter,
} from "./facets.ts";

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
   "MÀN 2" của output/ascii-man-diem-do.txt. Đóng hồ sơ (nút "← Điểm đo") quay lại đúng bảng cũ.

   18/08 chiều (owner chốt redesign, phương án A) — SỬA I4b/"MÀN 2": bấm dòng nay mở DRAWER tóm tắt
   đứng CẠNH bảng (SignalDrawer.tsx), hồ sơ đầy đủ lùi một nấc sau nút "Open full profile"
   (`profileOpen`). Đóng hồ sơ quay về bảng + drawer đang mở, không về bảng trần — người dùng đang
   đứng ở điểm đo đó. Văn bản charter I4b chưa sửa theo — việc của owner.

   18/08 tối (owner) — SỬA CHARTER §6 "buộc trưng" lần nữa: T1·T3 và khối độ tin dữ liệu RỜI HẲN
   màn này, thành noti chỉ-hiện-khi-lệch ở đầu CXM Overview (overview/SignalHealthNoti.tsx) — hai
   khối chỉ còn là thân chi tiết của noti đó. Văn bản charter chưa sửa theo — việc của owner.

   12/08 (redesign): cả bộ lọc (`filter`) là state của MÀN, cùng loại với `selectedSignalId` — không
   vào store. Nó CHỈ đổi độ đậm của bảng, không cắt dòng nào (F1). Đi tới/lui trong hồ sơ chạy theo
   ĐÚNG thứ tự đang thấy trên bảng, không theo thứ tự `data.signals` gốc: bảng nay chia nhóm theo
   phase nên thứ tự thấy được KHÁC thứ tự mảng dữ liệu, và "kế tiếp" phải là dòng ngay dưới mắt
   người dùng.

   12/08 chiều (owner): bảng chia nhóm theo phase, lọc làm mờ TẠI CHỖ. Ba chip của khối ① nay là
   MỘT TRƯỜNG của cùng bộ lọc đó (`filter.facet`) chứ không còn state riêng — chip và bốn ô lọc theo
   trường phải giao nhau, không đè nhau.

   12/08 (redesign layout) — thứ tự dọc của màn danh sách đổi thành ① → BẢNG → (② | bản khai không
   khớp). Trước đây ① và ② chia đôi màn theo chiều ngang rồi mới tới bảng, tức thứ người dùng vào
   màn để đọc bị đẩy xuống dưới mép màn đầu bởi hai khối vốn là CHÚ GIẢI của nó. Nay:
   · ① đứng sát trên bảng vì ba ô của nó là bộ lọc của chính bảng đó;
   · bảng lấy hết bề ngang và bắt đầu ngay dưới mép màn đầu;
   · ② (độ tin cậy của số đếm đã nhận) và khối bản-khai-không-khớp cùng là ĐIỀU KIỆN ĐỌC của bảng
     nên đứng chung một hàng phía dưới, ② rộng gấp đôi vì nó là bảng năm cột.
   Đánh đổi đã cân nhắc: khi Demo Mode TẮT, ô "Chưa nhận được số đếm" của ② nằm dưới ~30 dòng bảng.
   Chấp nhận được vì trạng thái chưa-nối-DB đã có banner toàn cục ở đầu app nói trước rồi. */
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
  /* Hồ sơ đầy đủ chỉ mở qua nút trong drawer — openSignal KHÔNG đụng cờ này, để prev/next dùng
     chung được cho cả hai tầng (đang ở tầng nào thì đi tới/lui ở tầng đó). */
  const [profileOpen, setProfileOpen] = useState(false);
  /* Dòng vừa mở hồ sơ — KHÔNG xoá khi đóng hồ sơ, để bảng tô lại đúng chỗ vừa rời đi. Tách khỏi
     `selectedSignalId` vì hai câu hỏi khác nhau: "đang mở hồ sơ nào" và "vừa xem dòng nào". */
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SignalFilter>(EMPTY_SIGNAL_FILTER);
  /* Nhóm nào đang thu gọn. Rỗng = mở hết, và đó là MẶC ĐỊNH: màn kiểm kê mở ra đã giấu sẵn dữ liệu
     là tự phản bội việc của nó. Ở đây chứ không trong SignalTable vì mở hồ sơ thì bảng bị THAY —
     để trong bảng là mỗi lần quay về từ hồ sơ lại bung hết nhóm ra. */
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  function openSignal(id: string) {
    setSelectedSignalId(id);
    setLastOpenedId(id);
  }

  const matched = useMemo(() => matchedSignalIds(data, filter), [data, filter]);
  const groups = useMemo(() => groupSignalsByPhase(data, matched), [data, matched]);
  /* Thứ tự đi tới/lui trong hồ sơ = thứ tự PHẲNG của bảng đã chia nhóm, không phải `data.signals`.
     CỐ Ý KHÔNG trừ nhóm đang thu gọn: thu gọn là việc của mắt trên bảng, không phải một phép lọc
     dữ liệu — bấm "kế tiếp" đủ số lần vẫn phải đi hết 30 điểm đo. Trừ đi thì "kế tiếp" nhảy cóc
     theo một trạng thái hiển thị mà người dùng đã rời khỏi màn bảng từ lâu. */
  const rows = useMemo(() => orderedSignals(groups), [groups]);

  const selectedIndex = selectedSignalId ? rows.findIndex((s) => s.id === selectedSignalId) : -1;
  const selectedSignal = selectedIndex >= 0 ? rows[selectedIndex] : undefined;

  return (
    <div className="p-8">
      {/* Mốc số liệu lên CÙNG HÀNG với tên màn thay vì nằm thành một dòng riêng dưới nó: nó là một
          dữ kiện phụ của cả màn, không phải một mục nội dung, và mỗi dòng riêng ở đây đẩy bảng
          xuống thêm một nấc. */}
      <div className="flex flex-wrap items-end gap-x-4">
        <PageTitle route="signals" />
        {/* Khi hồ sơ đang mở thì mốc số liệu ở đây IM: thanh đầu hồ sơ ngay dưới đã in đúng chuỗi
            đó, và thanh kia mới là cái còn dính lại khi cuộn. Hai lần cùng một mốc cách nhau 40px
            là một dữ kiện đọc thành hai. */}
        {data.asOf && !(selectedSignal && profileOpen) ? (
          <p className="mb-4 ml-auto text-[12px] text-ink-3" data-testid="signals-asof">
            Data as of {data.asOf}
          </p>
        ) : null}
      </div>

      {/* luật 11/08 (bổ sung, ghi đè bất biến 9 charter Module I theo owner 11/08): bỏ câu giới hạn đầu màn */}

      {selectedSignal && profileOpen ? (
        <SignalProfile
          data={data}
          signal={selectedSignal}
          onBack={() => setProfileOpen(false)}
          dims={dims}
          cfg={cfg}
          nav={{
            index: selectedIndex,
            total: rows.length,
            onPrev: selectedIndex > 0 ? () => openSignal(rows[selectedIndex - 1].id) : undefined,
            onNext:
              selectedIndex < rows.length - 1 ? () => openSignal(rows[selectedIndex + 1].id) : undefined,
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <SignalInventoryBlock
            data={data}
            facet={filter.facet}
            onFacet={(next) => setFilter((f) => ({ ...f, facet: next }))}
          />

          {/* Drawer đứng CẠNH bảng, không đè: bảng co lại (min-w-0), drawer 320px dính mép trên.
              Đóng drawer thì bảng giãn về hết bề ngang — cùng một cây DOM, không remount bảng. */}
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <SignalTable
                data={data}
                onSelect={openSignal}
                matched={matched}
                selectedId={selectedSignalId ?? lastOpenedId}
                filter={filter}
                onFilter={setFilter}
                groups={groups}
                collapsed={collapsed}
                onCollapsed={setCollapsed}
              />
            </div>
            {selectedSignal ? (
              <SignalDrawer
                data={data}
                signal={selectedSignal}
                onClose={() => setSelectedSignalId(null)}
                onOpenProfile={() => setProfileOpen(true)}
                nav={{
                  index: selectedIndex,
                  total: rows.length,
                  onPrev: selectedIndex > 0 ? () => openSignal(rows[selectedIndex - 1].id) : undefined,
                  onNext:
                    selectedIndex < rows.length - 1
                      ? () => openSignal(rows[selectedIndex + 1].id)
                      : undefined,
                }}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
