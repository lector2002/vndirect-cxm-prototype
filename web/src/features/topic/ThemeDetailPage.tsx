import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import type { CxmData, DimRow, TaxNode } from "../../data/schema/index.ts";
import { fx } from "../../domain/index.ts";
import { Bars, Card, Note, Sparkline } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { useCxmStore } from "../../store/store.ts";

/* VOC-STACKED-SPEC §5 — /topic/:id. BLOCKER: domain/search.ts gửi CẢ id L2 (feature) VÀ id
   theme/subtheme (reason) vào route này (map feature→topic/:id, reason theme/subtheme→topic/:id).
   Resolve theo id TRƯỚC rồi branch theo `lv` — TUYỆT ĐỐI KHÔNG chỉ tìm lv==='theme' rồi báo "không
   tìm thấy" cho id hợp lệ khác lv, sẽ làm mọi hit "feature" của Search chết ngõ cụt. */
export type ThemeDetailPageProps = {
  useStore?: typeof useCxmStore;
};

const EVIDENCE_N = 5;

function ThemeDetailSections({ theme, data, parentNote }: { theme: TaxNode; data: CxmData; parentNote?: string }) {
  const subs = data.tax
    .filter((t) => t.lv === "subtheme" && t.parentId === theme.id)
    .slice()
    .sort((a, b) => b.n - a.n);
  const subRows: DimRow[] = subs.map((s) => ({ id: s.id, l: s.name, v: s.n }));
  const groupLabels = Array.from(new Set(data.ins.filter((i) => i.theme === theme.id).flatMap((i) => i.seg)));
  const evidence = data.ev.filter((e) => e.tax.includes(theme.id)).slice(0, EVIDENCE_N);
  const color = (theme.cat && data.cats[theme.cat]?.color) || "var(--ink3)";

  return (
    /* data-tour: mốc "topic-detail" của bản giới thiệu (seed.ts:943). Neo vào cả thân màn chứ không
       riêng header — lời dẫn là "Màn chi tiết riêng của một topic", nên chỗ tô sáng phải là chính
       cái màn đó. */
    <div className="flex flex-col gap-4" data-tour="topic-detail">
      {parentNote ? <Note>{parentNote}</Note> : null}
      {/* 1. Header: tên + tổng n + mini-trend + why. */}
      <Card title={theme.name} subtitle={theme.why}>
        <div className="flex items-center gap-5">
          <div>
            <div className="text-[28px] font-bold tabular-nums">{nf(fx(theme.n))}</div>
            <div className="t-meta">Tổng tín hiệu</div>
          </div>
          {theme.pts?.length ? <Sparkline points={theme.pts} color={color} /> : null}
        </div>
      </Card>
      {/* 2. Breakdown sub-theme — n THẬT. */}
      <Card title="Breakdown sub-theme">
        {subRows.length ? (
          <Bars rows={subRows} axisLabel="Số tín hiệu, theo sub-theme" />
        ) : (
          <div className="t-meta">Chưa có sub-theme.</div>
        )}
      </Card>
      {/* 3. Nhóm khách nhắc tới — nhãn thật từ data.ins, không số. */}
      <Card title="Nhóm khách nhắc tới">
        {groupLabels.length ? (
          <div className="flex flex-wrap gap-1.5">
            {groupLabels.map((label) => (
              <span
                key={label}
                className="inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border border-line bg-surface-2 text-ink-2"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <div className="t-meta">Chưa gắn nhóm khách.</div>
        )}
      </Card>
      {/* 4. Evidence mẫu. */}
      <Card title="Evidence mẫu">
        {evidence.length ? (
          <ul className="flex flex-col gap-2.5">
            {evidence.map((e) => (
              <li key={e.id} className="text-[13px]">
                <div>&quot;{e.q}&quot;</div>
                <div className="t-meta mt-0.5">
                  {e.src} · {e.at}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="t-meta">Chưa có evidence mẫu.</div>
        )}
      </Card>
    </div>
  );
}

export function ThemeDetailPage({ useStore = useCxmStore }: ThemeDetailPageProps) {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const data = useStore((s) => s.data);
  const node = data.tax.find((t) => t.id === id);

  let body: ReactNode;
  if (!node) {
    body = <Note tone="crit">Không tìm thấy &quot;{id}&quot; trong taxonomy.</Note>;
  } else if (node.lv === "theme") {
    body = <ThemeDetailSections theme={node} data={data} />;
  } else if (node.lv === "subtheme") {
    const parent = data.tax.find((t) => t.id === node.parentId && t.lv === "theme");
    body = parent ? (
      <ThemeDetailSections
        theme={parent}
        data={data}
        parentNote={`Đang xem theme cha của sub-theme "${node.name}".`}
      />
    ) : (
      <Note tone="crit">Không tìm thấy theme cha của sub-theme &quot;{node.name}&quot;.</Note>
    );
  } else {
    body = (
      <Note>
        {/* luật 11/08: bỏ "Xem trong" (Dạng B) — giữ nguyên link atlas, ThemeDetailPage.test.tsx canh
            link này là điều hướng thật (regression search hit feature), không phải câu chỉ đường. */}
        &quot;{node.name}&quot; là node taxonomy tầng {node.lv} (mô tả CÁI GÌ khách gặp trong hành trình) — CHƯA có
        màn topic riêng cho tầng này. <a href="#/atlas">Bản đồ hành trình</a>.
      </Note>
    );
  }

  return (
    <div className="p-8">
      <h1 className="t-hero mb-4">Topic</h1>
      {body}
    </div>
  );
}
