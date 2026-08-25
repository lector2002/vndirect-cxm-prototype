import { useState, type ReactNode } from "react";
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
import { GlobalToolbar } from "./GlobalToolbar.tsx";
import { effectiveMonths, maxRealMonths, SEC, type SecKey } from "./sec.ts";
import { SetChips } from "./SetChips.tsx";
import { SignalHealthNoti } from "./SignalHealthNoti.tsx";

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
  /** @themestack (F1) và @toppri (ADR-002 §10) dùng — chart theo bằng chứng cần `dims[axis].label`,
      còn @toppri cần đọc nhóm khách theo `cfg.hv.dim` để đếm khách giá trị cao. */
  dims: Record<string, Dim>;
  onGo: (route: string) => void;
  selectedLines: string[];
  onToggleLine: (id: string) => void;
  /** Số tháng gần nhất từ bộ lọc Enterpret-style — CHỈ @topictrend dùng (sparkline "Xu hướng" là
      chuỗi thời gian thật). 8 block còn lại là snapshot, tự đánh dấu "Ảnh chụp" bên trong, KHÔNG
      nhận months (charter S2.2/S2.3 giữ nguyên, quyết định range owner 01/08). */
  months: number;
};

/* Vỏ gập cho block khai trong `DashQuestion.fold` (25/08, owner duyệt audit đọc-hiểu): lớp chi
   tiết (L2/L3 Keyword) gập mặc định thành một dòng tiêu đề — bấm mới dựng chart. Chỉ là vỏ hiển
   thị của màn Tổng quan, không đụng qt/domain; cùng qt đó ở thư viện Quantify vẫn mở. */
function FoldBlock({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={testId}>
      <button
        type="button"
        data-testid={`${testId}-toggle`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-baseline gap-2 rounded-[9px] border border-line bg-surface px-[13px] py-[9px] text-[13px] text-left hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
      >
        <span aria-hidden="true" className="flex-none text-[11px]">
          {open ? "▴" : "▸"}
        </span>
        <span className="min-w-0 font-semibold">{title}</span>
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

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
      return <TopPriorityBlock data={data} cfg={cfg} dims={dims} onGo={onGo} />;
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
  /* Range của bộ lọc thời gian là state GLOBAL (useTimeframeStore) — trang chỉ ĐỌC, không local
     state (quyết định owner 02/08). 19/08 (owner): toolbar không còn mount cố định ở Shell mà là
     một phần đầu trang của chính màn này (GlobalToolbar dưới) — chỉ màn tiêu thụ range mới có thanh. */
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
    <>
      {/* Toolbar timeframe + search là ĐẦU TRANG của màn này (19/08, owner) — đứng ngoài khung p-8
          để dải nền/viền phủ hết bề ngang <main>, trông y như hồi còn mount ở Shell. */}
      <GlobalToolbar useStore={useStore} />
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
      {/* Mốc số liệu (module-i-signal-registry-charter.md §12.3/§13) — data.asOf qua store, KHÔNG
          gõ tay chuỗi ngày. Đặt ở màn Tổng quan (dùng chung cho #/cxm và #/voc) vì đây là nơi người
          xem đọc số tổng hợp nhiều nhất; không rải sang màn khác trong lát này. */}
      {data.asOf ? (
        <p className="text-[12px] text-ink-3 mb-2" data-testid="overview-asof">
          Số liệu tính đến {data.asOf}
        </p>
      ) : null}
      {custom ? <CustomBanner onReset={() => resetBoard(cur.id)} /> : <div className="h-3.5" />}

      {/* Noti ngoại lệ điểm đo (owner 18/08 tối) — chỉ phần CXM, ẩn hẳn khi không có gì lệch;
          lý do dời khỏi #/signals: docblock SignalHealthNoti.tsx. */}
      {sec === "cxm" ? <SignalHealthNoti data={data} cfg={cfg} dims={dims} /> : null}

      {cur.qs.map((qq, qi) => {
        const bs = curBlocks(qi);
        /* Thân của MỘT block — dùng chung cho ô thường lẫn ô gập, để FoldBlock chỉ là vỏ. */
        const blockBody = (b: string) => {
          const item = b.startsWith("@") ? undefined : data.qt.find((q) => q.id === b);
          return b.startsWith("@") ? (
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
          ) : null;
        };
        /* Block fold ĐỨNG LIỀN NHAU gộp chung một ô grid (xếp dọc) — hai vỏ gập mỏng chia nhau một
           ô thay vì mỗi cái chiếm một ô rồi để ô cạnh nó trống (chính cái lỗ hổng cạnh q10 mà audit
           25/08 chỉ ra). Board tùy chỉnh bỏ bớt id thì `has` tự rơi về ô thường. */
        const foldSet = new Set(qq.fold ?? []);
        const groups: { fold: boolean; ids: string[] }[] = [];
        for (const b of bs) {
          const last = groups[groups.length - 1];
          if (foldSet.has(b) && last?.fold) last.ids.push(b);
          else groups.push({ fold: foldSet.has(b), ids: [b] });
        }
        return (
          <section key={qi} className="mb-[26px]">
            <h2 className="t-block mb-[5px]">{qq.q}</h2>
            {bs.length ? (
              <div className="grid grid-cols-2 gap-4 items-start">
                {groups.map((g) =>
                  g.fold ? (
                    <div key={g.ids.join("+")} className="flex flex-col gap-4">
                      {g.ids.map((b) => (
                        <div key={b} data-tour={`blk-${b}`}>
                          <FoldBlock testId={`fold-${b}`} title={data.qt.find((q) => q.id === b)?.name ?? b}>
                            {blockBody(b)}
                          </FoldBlock>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      key={g.ids[0]}
                      data-tour={`blk-${g.ids[0]}`}
                      className={g.ids[0].startsWith("@") && WIDE_BLOCKS.has(g.ids[0]) ? "col-span-2" : undefined}
                    >
                      {blockBody(g.ids[0])}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-ink-3 text-[13.5px]">
                {/* luật 12/08: bỏ "Thêm ở Quản lý set (Quantify)" — hướng dẫn thao tác */}
                Câu hỏi này chưa có khối nào.
              </div>
            )}
          </section>
        );
      })}
      </div>
    </>
  );
}
