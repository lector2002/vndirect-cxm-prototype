import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  defaultTopicLines,
  driftNodes,
  fallingThemes,
  freshThemes,
  risingThemes,
  themesByVolume,
  topicLines,
} from "../../domain/index.ts";
import { AxisLabel, Card, Note, TopicLineChart } from "../../design-system/index.ts";
import { TopicTrendBlock } from "../overview/blocks/index.ts";
import { effectiveMonths, maxRealMonths } from "../overview/sec.ts";
import { useCxmStore } from "../../store/store.ts";
import { useTimeframeStore } from "../../store/timeframe.ts";

/* Màn "Topic & xu hướng" #/topics — port V.topics (prototype dòng 3853-3891).

   Đây là trục THỜI GIAN của VoC: cái gì đang nổi lên, cái gì đã lắng xuống, cái gì mới xuất hiện.
   Hai màn kia không trả lời được câu này — #/sources hỏi "dữ liệu có về không", #/vocjourney hỏi
   "khách nói ở điểm chạm nào".

   BỐN CHỖ CỐ Ý KHÁC PROTOTYPE.

   1. KHÔNG PORT `monthly()`. Prototype vẽ chart trên chuỗi 12 điểm mà **6 điểm đầu là ngoại suy**,
      rồi dán nhãn tháng thật lên. Lý do đầy đủ ở docblock `domain/topics.ts`. Ở đây chart đọc thẳng
      `pts` — fixture React đã có 12 điểm thật.

   2. KHÔNG DỰNG RANGE TOGGLE RIÊNG. Prototype có cụm 3m/6m/1y riêng cho từng chart. App này đã có
      thanh thời gian CHUNG ở đầu màn (`TimeframeBar`), và thanh đó tự chặn ở số kỳ thật rồi nói
      thẳng "không nội suy thêm". Dựng thêm một cụm nữa là hai chỗ điều khiển cùng một thứ, và
      chúng sẽ lệch nhau. Route `topics` được thêm vào `TIMEFRAME_ROUTES` cùng lượt này — đúng như
      lời chú sẵn có ở `App.tsx` dặn.

   3. CÂU TIÊU ĐỀ ĐẾM TRÊN KỲ ĐANG XEM. Prototype ghi "qua 6 kỳ gần nhất" cứng trong lời dẫn. Số kỳ
      ở đây là runtime theo bộ lọc, nên câu chữ đọc từ chính con số đang vẽ.

   4. DẢI MẪU SỐ CỦA CHART NÓI RÕ PHẦN KHÔNG VẼ. Chart mở sẵn tối đa sáu đường (3 tăng + 2 giảm +
      1 mới). Taxonomy nở bao nhiêu thì vẫn sáu — nên phần còn lại phải được ĐẾM RA CHỮ, không cắt
      im lặng. Cùng luật với bảng độ phủ và bảng topic bên dưới. */

/** Nhãn diễn giải drift — cùng bộ chữ với cột Trạng thái của bảng bên dưới (D_DRIFT trong
    `TopicTrendBlock.tsx`), để một node không được gọi bằng hai tên trên cùng một màn. */
const D_DRIFT: Record<string, string> = {
  "new-term": "Thuật ngữ mới chưa gán",
  duplicate: "Có thể trùng nghĩa",
  shifting: "Ngữ nghĩa đang lệch",
};

export type TopicsPageProps = {
  useStore?: typeof useCxmStore;
};

export function TopicsPage({ useStore = useCxmStore }: TopicsPageProps) {
  const navigate = useNavigate();
  const data = useStore((s) => s.data);
  const cfg = useStore((s) => s.cfg);
  const range = useTimeframeStore((s) => s.range);
  const months = effectiveMonths(range, maxRealMonths(data));

  /* Lazy-init một lần: đổi bộ lọc thời gian KHÔNG được ném đi các đường người dùng đã tự chọn.
     Prototype cũng giữ như vậy (`if (!ST.sel.topicLines)`, dòng 3866). */
  const [lines, setLines] = useState<string[]>(() => defaultTopicLines(data, months));

  const themes = themesByVolume(data);
  const rising = risingThemes(data, months);
  const falling = fallingThemes(data, months);
  const fresh = freshThemes(data, months);
  const drifts = driftNodes(data);
  const series = topicLines(data, lines, months);

  const toggleLine = (id: string) =>
    setLines((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-5">
      <h1 data-testid="topics-hero" className="t-hero max-w-[38ch] mb-2">
        {themes.length} topic đang mở, {rising.length} đang tăng theo hướng xấu.
      </h1>
      <p className="t-meta max-w-[90ch] mb-4">
        Trục <b>thời gian</b> của tiếng nói khách hàng: cái gì đang <b>nổi lên</b>, cái gì đã{" "}
        <b>lắng xuống</b>, cái gì <b>mới xuất hiện</b> — đọc trên {months} kỳ gần nhất. Bấm một topic
        để xem chi tiết, verbatim và quyết định phân loại.
      </p>

      {/* Node cần người quyết: hệ thống chỉ PHÁT HIỆN, không tự gộp/tách. Nút dẫn thẳng vào node
          đó thay vì bắt người đọc tự tìm trong bảng. */}
      {drifts.length ? (
        <div className="mb-4">
          <Note tone="warn">
            <div data-testid="topics-drift">
              <b>⚠ {drifts.length} node cần người quyết định</b>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {drifts.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    data-testid={`topics-drift-${n.id}`}
                    onClick={() => navigate(`/topic/${n.id}`)}
                    className="px-2 py-1 rounded-[7px] text-[12px] font-semibold border border-line bg-surface text-ink-2 hover:border-ink-3"
                  >
                    {n.name} · {D_DRIFT[n.drift!] ?? n.drift}
                    {/* Node cần quyết KHÔNG chỉ nằm ở tầng theme — đo trên demoData 06/08: một node
                        tầng L3 và một sub-theme cũng đang chờ. Màn chi tiết nhận cả ba (tầng trên
                        theme thì nó nói "chưa có màn riêng cho tầng này" rồi trỏ sang Bản đồ), nên
                        chip ghi luôn tầng để người bấm biết trước sẽ mở ra dạng nào. */}
                    {n.lv === "theme" ? "" : ` · tầng ${n.lv}`}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                Hệ thống phát hiện, con người quyết định. Không có gộp/tách tự động — bấm một node để
                xem đề xuất và chọn.
              </div>
            </div>
          </Note>
        </div>
      ) : null}

      <div data-tour="topic-chart" className="mb-4">
        <Card
          title="Chuyển động chủ đề theo kỳ"
          /* Vế đầu nói ĐÚNG số đường đang vẽ trên tổng số topic — cùng cách sửa mẫu số đã áp cho
             bảng topic và chart độ phủ ngày 06/08. Ba vế sau là ba nhóm chuyển động, thông tin
             thật nhưng KHÔNG phải mẫu số của chart. */
          denomStrip={
            <span data-testid="topics-chart-denom">
              Đang vẽ {series.length} trên {themes.length} topic · {rising.length} nổi lên ·{" "}
              {falling.length} lắng xuống · {fresh.length} mới xuất hiện
            </span>
          }
        >
          <TopicLineChart
            series={series.map((l) => ({ id: l.t.id, name: l.t.name, pts: l.pts, fresh: l.fresh }))}
            onRemove={toggleLine}
          />
          <AxisLabel>
            {`Trục dọc là volume tuyệt đối, chung một thang cho mọi đường · trục ngang là ${months} kỳ gần nhất · đường nét đứt kèm ✨ là topic mới trồi lên từ gần sàn`}
          </AxisLabel>
          {/* Màn này có HAI dải mẫu số nằm sát nhau: chart nói "Đang vẽ N trên 14 topic", bảng ngay
              dưới nói "Đang hiện 8 trên 14 topic". Không con số nào sai, nhưng cùng mẫu số + cùng
              đơn vị nghe được ("topic") + đặt cạnh nhau thì người đọc tự so hai vế đầu và tưởng
              chúng phải khớp. Nói thẳng ra rằng hai vế đếm hai thứ khác nhau. KHÔNG in con số của
              bảng ở đây: bảng mở rộng được (nút "Xem hết"), in ra là câu này sai ngay khi người ta
              bấm mở. */}
          <div className="t-meta text-[12px] mt-1" data-testid="topics-chart-bridge">
            Hai dải mẫu số trên màn này đếm hai thứ khác nhau: ở đây là số <b>đường đang mở trên
            biểu đồ</b>, còn ở bảng bên dưới là số <b>dòng bảng đang liệt kê</b> — cùng trên{" "}
            {themes.length} topic đó.
          </div>
        </Card>
      </div>

      {/* Bảng dùng lại nguyên block đã có ở Tổng quan VoC — nó vốn được thiết kế để TRANG sở hữu
          lựa chọn ★ (xem docblock `selectedLines` của nó), và trang này chính là chỗ đó. Dựng bảng
          thứ hai là hai bảng cùng nói một chuyện rồi trôi khỏi nhau. */}
      <div data-tour="topic-table" className="mb-4">
        <TopicTrendBlock
          data={data}
          cfg={cfg}
          months={months}
          selectedLines={lines}
          onToggleLine={toggleLine}
          onGo={(route) => navigate(`/${route}`)}
        />
      </div>

      <Note>
        Bấm <b>★</b> ở bảng trên để thêm hoặc bớt một đường trên biểu đồ; bấm vào dòng để mở màn chi
        tiết topic — xu hướng theo kỳ, chủ đề con, điểm chạm, verbatim và quyết định phân loại.
      </Note>
    </div>
  );
}
