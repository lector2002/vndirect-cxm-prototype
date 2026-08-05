import type { TourStop } from "../../data/schema/index.ts";

/* Bản giới thiệu có dẫn (guided tour) — phần THUẦN LOGIC: trong 18 chặng khai ở `seedTour`, chặng
   nào bản React đi qua được, chặng nào phải giữ lại và VÌ SAO.

   Đây là chỗ dễ làm ẩu nhất của cả tính năng. Tour là thứ nói với người mới "màn này là gì" — nên
   một tour dẫn người ta tới màn chưa dựng, hoặc đọc lời dẫn mô tả bố cục đã bị thay, thì nó không
   phải "chưa hoàn thiện" mà là ĐANG NÓI SAI. Thà đi 9 chặng đúng và nói thẳng còn 9 chặng đang chờ,
   hơn là đi đủ 18 chặng mà một nửa nói sai.

   Prototype không gặp việc này vì ở đó cả 18 màn đều có thật (một file HTML). Bản React mới port
   được một phần, nên bước lọc này là của riêng bản React và sẽ TỰ CO LẠI khi các màn kia lên: chỉ
   cần thêm route vào `SCREEN_BUILT`, không phải sửa gì trong bộ máy tour. */

/** Route (segment đầu của `TourStop.r`) đã có thân màn thật trong `src/`. Đối chiếu trực tiếp với
    bảng route ở App.tsx: mọi route ngoài danh sách này rơi vào `<Placeholder>`. */
const SCREEN_BUILT = new Set(["cxm", "voc", "atlas", "topic", "work", "quantify", "settings"]);

/* Ba chặng `work` là ca RIÊNG, không phải "màn chưa dựng": `#/work` có thật và đầy đủ dữ liệu.
   Vấn đề nằm ở LỜI DẪN — nó tả "Bốn làn công việc", "Làn Chờ duyệt", "Làn verify", trong khi owner
   đã chốt bỏ hẳn board 4 làn, đổi sang một danh sách thanh ngang (WorkPage.tsx:19-22 ghi lại quyết
   định đó). Nên `seedTour` đang mô tả một bố cục KHÔNG CÒN TỒN TẠI.

   Không tự viết lại ba câu này: lời dẫn là chữ nói với người dùng, thuộc quyền owner, không phải chi
   tiết cài đặt để lập trình viên tiện tay sửa. Giữ lại và nêu tên cho tới khi có bản chữ mới. */
const STALE_COPY = new Set(["work"]);

export type HeldStop = { stop: TourStop; reason: string };
export type TourSplit = {
  /** Chặng đi được, giữ NGUYÊN thứ tự khai trong `seedTour`. */
  walk: TourStop[];
  /** Chặng giữ lại, kèm lý do đọc được — để nói ra chứ không lặng lẽ bỏ. */
  held: HeldStop[];
};

/** Segment đầu của route: `"topic/x-th-device"` → `"topic"`. */
function screenOf(stop: TourStop): string {
  return stop.r.split("/")[0];
}

/** Lý do KHÔNG đi qua chặng này, hoặc `null` nếu đi được. */
export function holdReason(stop: TourStop): string | null {
  const screen = screenOf(stop);
  if (!SCREEN_BUILT.has(screen)) return "màn chưa dựng ở bản React";
  if (STALE_COPY.has(screen)) return "lời dẫn còn tả bố cục cũ (board 4 làn đã bỏ)";
  return null;
}

export function splitTour(stops: TourStop[]): TourSplit {
  const walk: TourStop[] = [];
  const held: HeldStop[] = [];
  for (const stop of stops) {
    const reason = holdReason(stop);
    if (reason) held.push({ stop, reason });
    else walk.push(stop);
  }
  return { walk, held };
}

/* Chặng đi được vẫn có thể KHÔNG tìm thấy mốc của nó, vì hai mốc dưới đây chỉ tồn tại ở một số
   trạng thái của AtlasPage — và trạng thái đó là state cục bộ (useState, AtlasPage.tsx:84-87).

   Mỗi ca một lý do RIÊNG. Bản đầu ở đây dùng một câu chung ("chỉ hiện sau khi bạn thao tác trên
   màn") cho mọi ca — đúng cái lỗi cả stream đang chữa: màn nói một điều nghe rất chắc chắn về chính
   nó, mà điều đó chỉ đúng cho một trường hợp. Ca chưa lường trước phải rơi vào câu "chưa rõ vì sao"
   ở `absentReason`, không được mượn lý do của ca đã biết.

   Ghi rõ để không ai đọc nhầm bảng này thành "cả hai ca đều đang xảy ra": ở thứ tự chặng hôm nay
   chỉ `atlas-inspector` thật sự rơi vào nhánh vắng mốc. `atlas-spine` thì không, vì ba chặng atlas
   đứng sau ba chặng `#/cxm`, nên tour luôn rời khỏi `#/atlas` rồi quay lại — AtlasPage remount, flow
   về mặc định (flow đang có dữ liệu quan sát), xương sống chắc chắn có. Người dùng có mở sẵn một
   flow ngoài pilot rồi bấm chạy tour cũng vậy (TourOverlay.test.tsx canh đúng điều này). Câu cho
   `atlas-spine` để sẵn cho ngày một chặng atlas dẫn đầu danh sách. */
const ABSENT_REASON: Record<string, string> = {
  "atlas-inspector":
    "Hồ sơ bước chỉ hiện sau khi đã chọn một bước trên xương sống, mà màn cố ý không chọn sẵn bước nào — nên ở chặng này chưa có gì để tô sáng.",
  "atlas-spine":
    "Xương sống chỉ hiện khi flow đang mở có bước, mà flow ngoài pilot thì chưa khai bước nào — nên chưa có gì để tô sáng.",
};

/** Vì sao mốc của chặng này không có trên màn. Ca chưa biết thì NÓI LÀ CHƯA BIẾT — không mượn lý
    do của ca khác, vì một lý do sai còn tệ hơn không có lý do.

    Chỉ MÔ TẢ, tuyệt đối không bảo người ta làm gì. Bản trước ở đây viết "thoát tour, chọn một bước,
    rồi mở lại" — nghe hợp lý mà làm không được: mở lại thì tour bắt đầu từ chặng `#/cxm`, tour rời
    khỏi `#/atlas` rồi quay lại, AtlasPage remount, `selectedStepId` về `null` (AtlasPage.tsx:87).
    Đúng chính cái remount vừa dùng để chứng `atlas-spine` an toàn. Một lời khuyên không thực hiện
    được cũng là màn nói sai, chỉ là sai kín đáo hơn. */
export function absentReason(sel: string): string {
  const name = /^\[data-tour="([^"]+)"\]$/.exec(sel)?.[1];
  return (
    (name ? ABSENT_REASON[name] : undefined) ??
    "Không tìm thấy chỗ cần tô sáng trên màn này. Chưa rõ vì sao — có thể màn đang ở một trạng thái khác với lúc bảng chặng được soạn."
  );
}

/** Một dòng nói thẳng còn bao nhiêu chặng chưa đi được và vì sao — hiện ở chặng cuối. Gộp theo lý
    do chứ không liệt kê từng dòng: người xem cần biết CÒN GÌ, không cần đọc danh mục. */
export function heldSummary(held: HeldStop[]): string | null {
  if (held.length === 0) return null;
  const byReason = new Map<string, number>();
  for (const h of held) byReason.set(h.reason, (byReason.get(h.reason) ?? 0) + 1);
  const parts = [...byReason].map(([reason, n]) => `${n} chặng ${reason}`);
  return `Bản giới thiệu này còn ${held.length} chặng chưa đi được: ${parts.join("; ")}.`;
}
