import { useState } from "react";
import type { Source } from "../../data/schema/index.ts";
import {
  brokenImpacts,
  continuityCount,
  freshnessCount,
  instrumentedCount,
  lagText,
  passiveActive,
  sourceHealth,
  sourcesByProblem,
  surveyCounts,
  surveysByProblem,
} from "../../domain/index.ts";
import type { IntegrityCount } from "../../domain/index.ts";
import { Badge, Note, SrcMatrix, Stat } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { useCxmStore } from "../../store/store.ts";
import { SourceProfile } from "./SourceProfile.tsx";

/* Nguồn dữ liệu #/sources — port V.sources (prototype dòng 3671-3757).

   VÌ SAO KHẢO SÁT NẰM TRONG MÀN NÀY chứ không có route riêng (giữ nguyên lý do prototype dòng
   3666-3669 và 3759-3762): khảo sát cũng là một nguồn phản hồi, chỉ khác ở chỗ ta TỰ TẠO ra nó thay
   vì chờ khách nói. Để riêng một màn thì không bao giờ đọc được tỷ lệ nghe thụ động so với hỏi chủ
   động — mà đó chính là con số nói ra ta đang nghe hay đang hỏi.

   BỐN CHỖ CỐ Ý KHÁC PROTOTYPE:

   1. DẢI BỐN Ô SỐ MANG BỐN ĐƠN VỊ. Prototype để ba ô đọc trần là "N/M" trong khi hai ô đếm NGUỒN
      còn một ô đếm ĐIỂM ĐO. Ở đây đơn vị nằm TRONG giá trị ("6/7 nguồn", "25/30 điểm đo"), nên bốn
      ô không còn giả vờ cùng một thước. Lý do dài ở docblock domain/sources.ts bẫy 1.

   2. CÂU CẢNH BÁO CUỐI MÀN SINH TỪ DỮ LIỆU. Prototype đóng cứng một câu về Zalo OA (dòng 3752).
      Ở đây câu đó dựng từ `brokenImpacts` nên đúng với bất kỳ số nguồn hỏng nào, kể cả KHÔNG nguồn
      nào hỏng — và nó KHÔNG phán con số đang cao hơn hay thấp hơn thực tế, vì dữ liệu không nói
      được điều đó (bẫy 3 cùng docblock).

   3. TIÊU ĐỀ KHÔNG NÓI "LÀM SAI". Prototype viết "… và điều đó làm sai N chỉ số". Nguồn hỏng làm
      chỉ số tính trên dữ liệu THIẾU — chiều lệch thì không suy được. "Đang ăn dữ liệu từ chúng" là
      đúng thứ dữ liệu chứng minh được.

   4. HAI BẢNG ĐỀU CẮT. Hôm nay 7 nguồn và 6 khảo sát nên chưa cắt gì, nhưng một ngân hàng đủ nguồn
      thì bảng này dài vài chục dòng. Cùng khuôn với các chart đã sửa: xếp cái đáng nhìn lên đầu,
      đếm phần còn lại ra chữ, mở hết khi được yêu cầu, danh sách mở ra thì cuộn trong khung.
      LƯU Ý cho phiên sau: luật cắt owner duyệt nói về CHART. Bảng nguồn là một sổ đăng ký, không
      phải chart — nó cắt được vì đã xếp nguồn hỏng lên đầu, nên cái cắt đi luôn là nguồn đang khoẻ.
      Đừng đọc chỗ này thành "mọi bảng đều cắt". */

/** Số dòng hiện sẵn ở hai bảng. */
const TOP_ROWS = 8;

const TABS = [
  ["health", "Sức khỏe nguồn"],
  ["matrix", "Nguồn × nền tảng"],
  ["active", "Nguồn chủ động"],
] as const;

type TabKey = (typeof TABS)[number][0];

const HEALTH_LABEL = { ok: "Đang nhận", stale: "Trễ hơn SLA", down: "Ngừng gửi" } as const;
const HEALTH_BADGE = { ok: "ok", stale: "watch", down: "crit" } as const;
const PF_LABEL: Record<string, string> = { ios: "iOS", android: "Android", web: "Web", server: "Server" };

function countText(c: IntegrityCount): string {
  return `${c.n}/${c.of} ${c.unit}`;
}

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function SourcesPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);

  const [tab, setTab] = useState<TabKey>("health");
  // Chưa mở hồ sơ nào khi mới vào màn — cùng rule với hồ sơ bước ở #/atlas và điểm chạm ở #/vocjourney.
  const [openSrcId, setOpenSrcId] = useState<string | null>(null);
  const [srcAll, setSrcAll] = useState(false);
  const [svAll, setSvAll] = useState(false);

  const ordered = sourcesByProblem(data, cfg);
  const shownSources = srcAll ? ordered : ordered.slice(0, TOP_ROWS);
  const impacts = brokenImpacts(data, cfg);
  const fresh = freshnessCount(data, cfg);
  const cont = continuityCount(data, cfg);
  const instr = instrumentedCount(data);
  const { passive, active, ratio } = passiveActive(data);
  const sv = surveyCounts(data);
  const svOrdered = surveysByProblem(data);
  const shownSurveys = svAll ? svOrdered : svOrdered.slice(0, TOP_ROWS);

  const openSrc: Source | undefined = data.sources.find((s) => s.id === openSrcId);

  return (
    <div className="p-8">
      {/* KHÔNG có câu mở đầu ở đầu màn (quyết định owner 05/08, áp cho Bản đồ hành trình rồi mở ra
          mọi màn 06/08). Không mất thông tin nào: mỗi ô đếm đã tự nói nó đang đếm gì ở dòng chân ô,
          còn "chỉ số nào đang ăn dữ liệu hỏng" thì khối "Hệ quả cụ thể" cuối màn nêu ĐÍCH DANH từng
          chỉ số theo từng nguồn — chi tiết hơn hẳn con số tổng ở câu mở đầu cũ. `atRisk` mất caller
          cuối cùng ở màn này nên bỏ luôn; `metricsAtRisk` vẫn sống vì `ownersAtRisk` gọi nó. */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-4" data-testid="src-stats">
        <Stat
          label="Độ tươi"
          value={countText(fresh)}
          foot="còn trong SLA độ trễ của chính nó"
          srcNote="Nguồn đứt hẳn đếm ở ô Tính liên tục, không đếm hai lần"
          tone={fresh.n < fresh.of ? "var(--watch)" : undefined}
        />
        <Stat
          label="Tính liên tục"
          value={countText(cont)}
          foot="chưa đứt"
          srcNote={`Đứt = không nhận gì quá ${cfg.data.deadDays} ngày`}
          tone={cont.n < cont.of ? "var(--crit)" : undefined}
        />
        <Stat
          label="Độ phủ đo lường"
          value={countText(instr)}
          foot="đã instrument và đang bắn"
          srcNote="Đơn vị KHÁC hai ô bên trái — đếm điểm đo, không đếm nguồn"
          tone={instr.n < instr.of ? "var(--watch)" : undefined}
        />
        <Stat
          label="Nghe thụ động vs hỏi chủ động"
          value={ratio === null ? "chưa hỏi" : `${Math.round(ratio)}×`}
          foot={
            ratio === null
              ? "chưa có nguồn khảo sát nào — không có mẫu số để so"
              : `${nf(passive)} tín hiệu nghe được / ${nf(active)} mẫu hỏi chủ động`
          }
          srcNote="Khảo sát là nguồn duy nhất ta tự tạo ra"
        />
      </div>

      <div className="flex gap-1.5 border-b border-line mb-4" role="tablist" aria-label="Cách xem nguồn dữ liệu">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-testid={`src-tab-${k}`}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 -mb-px text-[12.5px] font-semibold border-b-2 ${
              tab === k ? "border-primary text-primary" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {k === "active" ? `${label} · ${sv.running}/${data.surveys.length} khảo sát đang chạy` : label}
          </button>
        ))}
      </div>

      {tab === "health" ? (
        <>
          <div className="bg-surface border border-line rounded shadow-card p-4">
            <div className="t-lbl mb-2.5">
              Sức khỏe từng nguồn — nguồn có vấn đề xếp lên đầu
              {ordered.length > TOP_ROWS ? ` · đang hiện ${shownSources.length} trên ${ordered.length}` : ""}
            </div>
            <div className={srcAll ? "max-h-[520px] overflow-y-auto pr-1" : ""}>
              <table data-tour="src-table" data-testid="src-table" className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className={TH}>Nguồn</th>
                    <th className={TH}>Loại</th>
                    <th className={TH}>Nền tảng</th>
                    <th className={TH}>Volume kỳ</th>
                    <th className={TH}>Độ trễ / SLA</th>
                    <th className={TH}>Nhận lần cuối</th>
                    <th className={TH}>Trạng thái</th>
                    <th className={TH}>Nguồn này sai thì chỉ số nào tính trên dữ liệu thiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {shownSources.map((s) => {
                    const h = sourceHealth(s, cfg);
                    const sla = cfg.source[s.id];
                    return (
                      <tr
                        key={s.id}
                        data-testid={`src-row-${s.id}`}
                        onClick={() => setOpenSrcId((cur) => (cur === s.id ? null : s.id))}
                        className="border-t border-line cursor-pointer hover:bg-surface-2"
                      >
                        <td className="py-1.5 px-1">
                          <b className="text-[13.5px]">{s.name}</b>
                          <div className="t-meta text-[11.5px] mt-0.5">{s.note}</div>
                        </td>
                        <td className="py-1.5 px-1 t-meta">{s.kind}</td>
                        <td className="py-1.5 px-1 t-meta">
                          {s.pf.length ? (
                            s.pf.map((p) => PF_LABEL[p] ?? p).join(" · ")
                          ) : (
                            <span className="text-ink-3">không gắn nền tảng</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1">
                          <b className="font-mono">{nf(s.vol)}</b>
                        </td>
                        <td className="py-1.5 px-1 t-meta">
                          <b className={h === "ok" ? "text-ink-2" : "text-crit"}>{lagText(s.lagH)}</b>
                          <div className="text-[11.5px]">
                            {sla === undefined ? "chưa đặt SLA riêng" : `SLA ${sla} giờ`}
                          </div>
                        </td>
                        <td className="py-1.5 px-1 t-meta">{s.last}</td>
                        <td className="py-1.5 px-1 whitespace-nowrap">
                          <Badge state={HEALTH_BADGE[h]} text={HEALTH_LABEL[h]} />
                        </td>
                        <td className="py-1.5 px-1">
                          {s.metrics.length ? (
                            s.metrics.map((mId) => (
                              <span
                                key={mId}
                                className={`inline-block px-2 py-0.5 rounded-[6px] text-[12px] font-semibold border bg-surface-2 mr-1 mb-1 ${
                                  h !== "ok" ? "text-crit border-current" : "text-ink-2 border-line"
                                }`}
                              >
                                {data.metrics.find((m) => m.id === mId)?.name ?? mId}
                              </span>
                            ))
                          ) : (
                            <span className="t-meta text-[11.5px]">không nối chỉ số nào</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {ordered.length > TOP_ROWS ? (
              <button
                type="button"
                data-testid="src-more"
                onClick={() => setSrcAll((v) => !v)}
                className="mt-2.5 text-[12px] font-semibold text-primary hover:underline"
              >
                {srcAll ? "Thu gọn" : `Xem hết ${ordered.length} nguồn (+${ordered.length - TOP_ROWS} nữa)`}
              </button>
            ) : null}
            <div className="t-meta text-[12px] mt-2.5">Bấm một dòng để mở hồ sơ dữ liệu của nguồn đó.</div>
          </div>
          {openSrc ? (
            <SourceProfile source={openSrc} data={data} cfg={cfg} onClose={() => setOpenSrcId(null)} />
          ) : null}
        </>
      ) : null}

      {tab === "matrix" ? (
        <div className="bg-surface border border-line rounded shadow-card p-4">
          <div className="t-lbl mb-2.5">
            Độ toàn vẹn theo nền tảng — một nguồn có thể khỏe trên nền tảng này và chết trên nền tảng khác
          </div>
          <SrcMatrix sources={ordered} metrics={data.metrics} cfg={cfg} />
        </div>
      ) : null}

      {tab === "active" ? (
        <div className="bg-surface border border-line rounded shadow-card p-4">
          <div className="t-lbl mb-2.5">
            Nguồn chủ động — khảo sát · {sv.running} đang chạy
            {sv.offTarget ? `, ${sv.offTarget} trong số đó chưa đạt mục tiêu` : ""}
            {sv.paused ? ` · ${sv.paused} đã tạm dừng` : ""}
            {svOrdered.length > TOP_ROWS ? ` · đang hiện ${shownSurveys.length} trên ${svOrdered.length}` : ""}
          </div>
          <div className={svAll ? "max-h-[520px] overflow-y-auto pr-1" : ""}>
            <table data-testid="src-survey-table" className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th className={TH}>Khảo sát</th>
                  <th className={TH}>Loại</th>
                  <th className={TH}>Trigger</th>
                  <th className={TH}>Cooldown</th>
                  <th className={TH}>Tỷ lệ trả lời</th>
                  <th className={TH}>Kết quả / mục tiêu</th>
                  <th className={TH}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {shownSurveys.map((s) => (
                  <tr key={s.id} data-testid={`src-survey-${s.id}`} className="border-t border-line">
                    <td className="py-1.5 px-1">
                      <b className="text-[13.5px]">{s.name}</b>
                      <div className="t-meta text-[11.5px] mt-1 max-w-[38ch]">{s.cond}</div>
                      <div className="t-meta text-[11.5px] mt-0.5">Thang đo: {s.scale}</div>
                    </td>
                    <td className="py-1.5 px-1">
                      <span className="inline-block px-2 py-0.5 rounded-[6px] text-[12px] border border-line bg-surface-2">
                        {s.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-1">
                      <code className="font-mono text-[12px] text-primary">{s.trigger}</code>
                    </td>
                    <td className="py-1.5 px-1 t-meta">{s.cd} ngày</td>
                    <td className="py-1.5 px-1">
                      <b className="font-mono">{s.rr}%</b>
                      <div className="t-meta text-[11.5px]">n = {nf(s.n)}</div>
                    </td>
                    <td className="py-1.5 px-1">
                      <b className="font-mono text-[15px]">{s.latest}</b>
                      <div className="t-meta text-[11.5px]">mục tiêu {s.target}</div>
                    </td>
                    <td className="py-1.5 px-1 whitespace-nowrap">
                      {s.status === "paused" ? (
                        <Badge state="unknown" text="Đang tạm dừng" />
                      ) : (
                        <Badge state={s.state} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {svOrdered.length > TOP_ROWS ? (
            <button
              type="button"
              data-testid="src-survey-more"
              onClick={() => setSvAll((v) => !v)}
              className="mt-2.5 text-[12px] font-semibold text-primary hover:underline"
            >
              {svAll ? "Thu gọn" : `Xem hết ${svOrdered.length} khảo sát (+${svOrdered.length - TOP_ROWS} nữa)`}
            </button>
          ) : null}

          <div className="mt-3.5 grid gap-2.5">
            <Note>
              <b>Quy tắc cooldown toàn cục:</b> mỗi khách chịu tối đa 1 khảo sát trong{" "}
              <b>{cfg.data.cooldown} ngày</b>, và luôn được phép bỏ qua. Đây là ràng buộc trong
              tracking plan để không làm khách mệt — hệ thống phải tự chặn, không phụ thuộc người vận
              hành nhớ. Đổi số ngày ở <a href="#/rules">Chỉ số &amp; ngưỡng</a>.
            </Note>
            {/* Câu này SINH TỪ DỮ LIỆU: khảo sát nào đang dừng thì tự nêu tên. Prototype đóng cứng
                tên "NPS" vào câu chữ — đổi trạng thái trong dữ liệu là câu nói sai ngay. */}
            {svOrdered
              .filter((s) => s.status === "paused")
              .map((s) => (
                <Note key={s.id} tone="warn">
                  <b>{s.name} đang tạm dừng.</b> Mọi xếp hạng dựa trên khảo sát này đều đang đọc số
                  của lần chạy cuối ({s.latest} trên n = {nf(s.n)}), không phải số của kỳ hiện tại —
                  con số trông vẫn chính xác nhưng không còn nói về hôm nay.
                </Note>
              ))}
          </div>
        </div>
      ) : null}

      {/* Hệ quả cụ thể — SINH TỪ DỮ LIỆU, không đóng cứng tên nguồn nào. Không nguồn nào hỏng thì
          không có khối này; nhiều nguồn hỏng thì mỗi nguồn một dòng. */}
      {impacts.length ? (
        <div className="mt-4" data-testid="src-impact">
          <Note tone="crit">
            <b>Hệ quả cụ thể đang xảy ra:</b>
            <ul className="mt-2 grid gap-2 list-disc pl-5">
              {impacts.map((b) => (
                <li key={b.source.id}>
                  <b>{b.source.name}</b> {b.health === "down" ? "đã ngừng gửi" : "đang trễ hơn SLA"}{" "}
                  {lagText(b.source.lagH).replace(/^trễ /, "")} (nhận lần cuối {b.source.last}).{" "}
                  {b.metrics.length ? (
                    <>
                      {b.metrics.map((m) => m.name).join(" và ")} đang tính trên dữ liệu thiếu quãng
                      đó. Dữ liệu <b>không nói được</b> con số đang cao hơn hay thấp hơn thực tế —
                      hỏi {[...new Set(b.metrics.map((m) => m.owner))].join(" · ")} trước khi dùng.
                    </>
                  ) : (
                    <>
                      Nguồn này chưa nối chỉ số nào nên không làm lệch con số nào, nhưng tiếng nói
                      của khách qua kênh này đang mất.
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Note>
        </div>
      ) : null}
    </div>
  );
}
