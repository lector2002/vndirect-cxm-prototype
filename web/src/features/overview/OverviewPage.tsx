import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Cfg, CxmData, Dim } from "../../data/schema/index.ts";
import { Note, QuantifyWidget } from "../../design-system/index.ts";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { useTimeframeStore } from "../../store/timeframe.ts";
import {
  AnomalyLanesBlock,
  CoverageBlock,
  IntentBlock,
  JourneyStateBlock,
  LanesBlock,
  OutcomesBlock,
  SrcMatrixBlock,
  ThemeStackBlock,
  TopicTrendBlock,
  TopPriorityBlock,
} from "./blocks/index.ts";
import { CustomBanner } from "./CustomBanner.tsx";
import { effectiveMonths, maxRealMonths, SEC, type SecKey } from "./sec.ts";
import { SetChips } from "./SetChips.tsx";

export type OverviewPageProps = {
  sec: SecKey;
  /** Store hook injectable — mặc định dùng store thật của app (singleton). Test dùng
      createCxmStore(new MockRepository()) để cô lập khỏi mutation của test khác trong cùng file
      (oracle map #10 charter Phase 2 cần setBoardBlocks/resetBoard để dựng banner tùy chỉnh). */
  useStore?: typeof useCxmStore;
};

/* 9 @block cần chiếm cả hàng (2 cột) trong lưới `.blks` — port 1-1 cờ `wide` (prototype BLOCKS,
   dòng 2108-2118). data/blocks.ts (S1) đã CỐ Ý bỏ cờ này vì đó là mối lo layout riêng của Overview
   (Phase 2) — KHÔNG nhân bản registry đó ở đây, chỉ khai lại đúng tập con "wide". */
const WIDE_BLOCKS = new Set([
  "@intent",
  "@topictrend",
  "@toppri",
  "@journeystate",
  "@lanes",
  "@outcomes",
  "@themestack",
]);

type BlockBodyProps = {
  b: string;
  data: CxmData;
  cfg: Cfg;
  /** CHỈ @themestack dùng (F1, module-f-charter.md) — chart theo bằng chứng cần `dims[axis].label`
      để đặt nhãn trục/denomStrip, khác 8 block còn lại (đọc data.tax/data.cats trực tiếp). */
  dims: Record<string, Dim>;
  onGo: (route: string) => void;
  selectedLines: string[];
  onToggleLine: (id: string) => void;
  /** Số tháng gần nhất từ bộ lọc Enterpret-style — CHỈ @topictrend dùng (sparkline "Xu hướng" là
      chuỗi thời gian thật). 8 block còn lại là snapshot, tự đánh dấu "Ảnh chụp" bên trong, KHÔNG
      nhận months (charter S2.2/S2.3 giữ nguyên, quyết định range owner 01/08). */
  months: number;
};

/* Map @block -> component S2.2/S2.3 đã dựng sẵn. Không tồn tại (id lạ) → không render gì, KHÔNG
   throw — cùng tinh thần "không throw" với fallback set (F3). */
function BlockBody({ b, data, cfg, dims, onGo, selectedLines, onToggleLine, months }: BlockBodyProps) {
  switch (b) {
    case "@srcmatrix":
      return <SrcMatrixBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@intent":
      return <IntentBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@themestack":
      return <ThemeStackBlock data={data} cfg={cfg} dims={dims} onGo={onGo} />;
    case "@anomlanes":
      return <AnomalyLanesBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@topictrend":
      return (
        <TopicTrendBlock
          data={data}
          cfg={cfg}
          onGo={onGo}
          selectedLines={selectedLines}
          onToggleLine={onToggleLine}
          months={months}
        />
      );
    case "@toppri":
      return <TopPriorityBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@journeystate":
      return <JourneyStateBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@coverage":
      return <CoverageBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@lanes":
      return <LanesBlock data={data} cfg={cfg} onGo={onGo} />;
    case "@outcomes":
      return <OutcomesBlock data={data} cfg={cfg} onGo={onGo} />;
    default:
      return null;
  }
}

/* Màn Tổng quan #/cxm và #/voc — container DUY NHẤT đọc store trong module này. URL LÀ SOURCE OF
   TRUTH của set đang xem (bất biến kiến trúc F2+F3, charter Phase 2): set = tìm theo (sec,setId)
   từ route; setId vắng hoặc trỏ set không còn tồn tại → fallback set mặc định (def) rồi set đầu
   tiên của phần đó. KHÔNG lưu set đang chọn vào Zustand — sẽ desync với URL. */
export function OverviewPage({ sec, useStore = useCxmStore }: OverviewPageProps) {
  const navigate = useNavigate();
  const { setId } = useParams<{ setId?: string }>();

  const data = useStore((s) => s.data);
  const cfg = useStore((s) => s.cfg);
  const dims = useStore((s) => s.dims);
  const boards = useStore((s) => s.boards);
  const resetBoard = useStore((s) => s.resetBoard);

  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  /* Range của bộ lọc thời gian giờ GLOBAL (TimeframeBar ở App Shell, useTimeframeStore) — trang
     này chỉ ĐỌC, không còn local state (quyết định owner 02/08, thay filter bar riêng của từng
     trang bằng một thanh chung cho mọi route có dữ liệu). */
  const range = useTimeframeStore((s) => s.range);
  const months = effectiveMonths(range, maxRealMonths(data));

  const S = SEC[sec];
  const sets = data.dash.filter((d) => d.sec === sec);
  const cur = sets.find((d) => d.id === setId) ?? sets.find((d) => d.def) ?? sets[0];

  const onGo = (route: string) => navigate(`/${route}`);
  const onToggleLine = (id: string) =>
    setSelectedLines((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (!cur) {
    // Phòng thủ: phần (sec) không có set nào trong dash — không xảy ra với seed thật, nhưng
    // không throw nếu xảy ra (khớp tinh thần F3 "không throw").
    return (
      <div className="p-8">
        <Note tone="crit">Phần "{S.label}" chưa có set nào.</Note>
      </div>
    );
  }

  const custom = !!boards[cur.id];
  const curBlocks = (qi: number): string[] => boards[cur.id]?.[qi] ?? cur.qs[qi].b;

  return (
    <div className="p-8">
      {/* `sec` LÀ route ('cxm' | 'voc') nên tiêu đề tra thẳng nhãn tab bằng nó — hai màn dùng chung
          component này, khỏi phải viết hai chuỗi tên rồi trông chúng khớp với sidebar. */}
      <PageTitle route={sec} />
      <SetChips
        sets={sets}
        currentId={cur.id}
        boards={boards}
        onSelect={(id) => navigate(`/${sec}/${id}`)}
        onManage={() => navigate("/quantify")}
      />
      {custom ? <CustomBanner onReset={() => resetBoard(cur.id)} /> : <div className="h-3.5" />}

      {cur.qs.map((qq, qi) => {
        const bs = curBlocks(qi);
        return (
          <section key={qi} className="mb-[26px]">
            <h2 className="t-block mb-[5px]">{qq.q}</h2>
            {bs.length ? (
              <div className="grid grid-cols-2 gap-4 items-start">
                {bs.map((b) => {
                  const wide = b.startsWith("@") && WIDE_BLOCKS.has(b);
                  const item = b.startsWith("@") ? undefined : data.qt.find((q) => q.id === b);
                  return (
                    <div key={b} data-tour={`blk-${b}`} className={wide ? "col-span-2" : undefined}>
                      {b.startsWith("@") ? (
                        <BlockBody
                          b={b}
                          data={data}
                          cfg={cfg}
                          dims={dims}
                          onGo={onGo}
                          selectedLines={selectedLines}
                          onToggleLine={onToggleLine}
                          months={months}
                        />
                      ) : item ? (
                        <QuantifyWidget
                          item={item}
                          data={data}
                          dims={dims}
                          cfg={cfg}
                          months={item.kind === "series" ? months : undefined}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-ink-3 text-[13.5px]">
                Câu hỏi này chưa có khối nào. Thêm ở <b>Quản lý set</b> (Quantify).
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
