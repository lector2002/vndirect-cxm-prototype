import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TourStop } from "../../data/schema/index.ts";
import { absentReason, heldSummary, splitTour } from "./tourStops.ts";

/* Coach-mark của bản giới thiệu có dẫn — port khối tour của prototype (output/cxm-platform-prototype.html
   CSS 412-430, JS 4719-4780). Ba lớp: nền tối bắt hết click, khung sáng khoét quanh component đích,
   popover giải thích neo cạnh nó.

   Khác prototype ở đúng hai chỗ, cả hai đều CỐ Ý:

   (1) Chặng nào đi được là do `tourStops.ts` quyết, không đi hết 18 chặng — xem docblock file đó.

   (2) Prototype có `tourPrep()` (dòng 4723) đặt sẵn state để component đích chắc chắn tồn tại: chọn
       set mặc định, chọn flow pilot, mở hồ sơ nguồn... Bản React KHÔNG cần và KHÔNG nên làm vậy:
       `#/cxm` và `#/voc` tự mở set `def:true` (đúng hai set prototype đặt tay), `#/atlas` tự chọn
       flow đang có dữ liệu quan sát, `#/topic/x-th-device` là route có tham số nên tự tới đúng chỗ.
       Chỗ duy nhất prototype phải đặt tay mà ta không đặt là `atlas-inspector` — nó chỉ tồn tại khi
       đã chọn một bước, mà rule 4 nói rõ mới vào màn thì CHƯA chọn bước nào. Prototype cũng để nguyên
       vậy (`ST.sel.atlasStep = null`, dòng 4726) và lời dẫn của chặng đó là một lời MỜI: "Chọn một
       bước để mở ba tab". Nên ở đó tour rơi vào nhánh không tìm thấy đích — và nhánh đó phải nói
       được ra điều ấy, chứ không im lặng hiện popover giữa màn như thể mọi thứ bình thường.

       Đi kèm: nền tối nuốt hết click (đúng như prototype), nên trong lúc tour chạy không ai chọn
       bước được. Câu ở nhánh vắng mốc vì thế chỉ MÔ TẢ vì sao chưa tô sáng được, không ra lệnh —
       xem `absentReason` trong tourStops.ts, ở đó ghi lại vì sao cả cách "thoát ra rồi chọn" cũng
       không phải lời khuyên dùng được. */

export type TourOverlayProps = {
  /** Toàn bộ chặng khai trong fixture (`data.tour`), CHƯA lọc — việc lọc là của component này. */
  stops: TourStop[];
  onClose: () => void;
};

type Box = { left: number; top: number; width: number; height: number };

const PAD = 8;
const GAP = 14;
const POP_W = 344;

/** Đặt popover: dưới đích nếu đủ chỗ → trên → giữa; kẹp ngang trong viewport (port `placePop`, 4768). */
function placePop(box: Box, popH: number): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bottom = box.top + box.height;
  let top: number;
  if (bottom + GAP + popH <= vh) top = bottom + GAP;
  else if (box.top - GAP - popH >= 0) top = box.top - GAP - popH;
  else top = Math.max(GAP, (vh - popH) / 2);
  const left = Math.max(GAP, Math.min(box.left + box.width / 2 - POP_W / 2, vw - POP_W - GAP));
  return { left, top };
}

export function TourOverlay({ stops, onClose }: TourOverlayProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { walk, held } = useMemo(() => splitTour(stops), [stops]);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [measureTick, setMeasureTick] = useState(0);
  const popRef = useRef<HTMLDivElement | null>(null);

  const stop = walk[i];
  const last = i === walk.length - 1;

  // Đổi chặng → đổi route trước; đo đích để ở effect sau, khi màn mới đã render xong.
  useEffect(() => {
    if (stop) navigate(`/${stop.r}`);
  }, [stop, navigate]);

  /* Đo đích SAU khi route đã đổi. Phụ thuộc cả `location.pathname` để chạy lại đúng lúc màn mới lên;
     thêm vài nhịp rAF vì component đích có thể còn một nhịp render nữa (chart, danh sách) — dừng
     ngay khi tìm thấy, không quay vòng vô hạn. */
  useEffect(() => {
    if (!stop) return;
    let frame = 0;
    let raf = 0;
    const tick = () => {
      const el = stop.sel ? document.querySelector(stop.sel) : null;
      if (el) {
        el.scrollIntoView({ block: "center", inline: "nearest" });
        const r = el.getBoundingClientRect();
        setBox({ left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
        return;
      }
      if (frame++ < 10) raf = requestAnimationFrame(tick);
      else setBox(null); // không tìm thấy đích — nhánh này phải NÓI RA, xem phần render.
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stop, location.pathname, measureTick]);

  const go = useCallback(
    (d: number) => setI((cur) => Math.min(walk.length - 1, Math.max(0, cur + d))),
    [walk.length],
  );

  // Esc để thoát — cùng phím prototype dùng (dòng 4780). Đổi cỡ cửa sổ thì đo lại vị trí đích.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onResize = () => setMeasureTick((n) => n + 1);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [onClose]);

  /* Không còn chặng nào đi được thì KHÔNG mở tour rỗng — nói thẳng vì sao. Hôm nay không xảy ra
     (9 chặng đi được), nhưng nếu ai đó rút `SCREEN_BUILT` xuống thì đây là câu phải hiện. */
  if (!stop) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-dark/60" data-testid="tour-empty">
        <div className="w-[344px] max-w-[88vw] bg-surface border border-line rounded-[13px] px-[17px] pt-[15px] pb-3.5 shadow-2xl">
          <b className="block text-[15px] mb-1.5">Chưa có chặng nào đi được</b>
          <p className="text-[13px] leading-[1.55] text-ink-2 m-0">{heldSummary(held)}</p>
          <div className="mt-3 flex">
            <button
              type="button"
              data-testid="tour-exit"
              className="ml-auto text-[12.5px] font-semibold text-ink-3 hover:text-ink"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const popH = popRef.current?.offsetHeight ?? 190;
  const pos = box ? placePop(box, popH) : null;
  const summary = last ? heldSummary(held) : null;

  return (
    <>
      {/* Nền tối NUỐT click chứ không đóng tour — đúng như prototype (412-416: "bắt click toàn màn
          để không bấm nhầm ra ngoài tour"). Bản đầu ở đây gắn `onClick={onClose}`, tức là bấm vào
          bất cứ đâu, kể cả vào chính chỗ đang được tô sáng, là tour tắt. Lối ra vẫn còn đủ: nút
          Thoát và phím Esc. */}
      <div className="fixed inset-0 z-[60]" data-testid="tour-mask">
        {box ? (
          <div
            data-testid="tour-hole"
            className="absolute rounded-[10px] border-2 border-primary pointer-events-none transition-[left,top,width,height] duration-200"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              boxShadow: "0 0 0 9999px rgba(23,20,17,.60)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-ink-dark/60 pointer-events-none" />
        )}
      </div>

      <div
        ref={popRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Bản giới thiệu — bước ${i + 1} trên ${walk.length}`}
        data-testid="tour-pop"
        className="fixed z-[61] w-[344px] max-w-[88vw] bg-surface border border-line rounded-[13px] shadow-2xl px-[17px] pt-[15px] pb-3.5"
        style={
          pos
            ? { left: pos.left, top: pos.top }
            : { left: "50%", top: "50%", transform: "translate(-50%,-50%)" }
        }
      >
        <span className="font-mono font-bold text-[11.5px] tracking-[0.09em] text-primary">
          {`BƯỚC ${i + 1}/${walk.length} · ${stop.grp}`}
        </span>
        <b className="block text-[15px] mt-[7px] mb-[5px]">{stop.t}</b>
        <p className="text-[13px] leading-[1.55] text-ink-2 m-0">{stop.d}</p>

        {/* Không tìm thấy đích: prototype lặng lẽ đưa popover ra giữa màn (4761-4765). Ở đây phải nói
            ra — người xem đang được chỉ vào một chỗ KHÔNG được tô sáng, im lặng thì họ tưởng mình
            nhìn sót. Lý do lấy theo TỪNG chặng (`absentReason`), không dùng một câu chung: có ít nhất
            hai ca khác hẳn nhau (chưa chọn bước / flow ngoài pilot), và một lý do sai thì tệ hơn
            không có lý do. */}
        {!box ? (
          <p className="text-[12px] leading-[1.5] text-ink-3 mt-2 mb-0" data-testid="tour-noanchor">
            {absentReason(stop.sel)}
          </p>
        ) : null}

        {summary ? (
          <p className="text-[12px] leading-[1.5] text-ink-3 mt-2 mb-0" data-testid="tour-held">
            {summary}
          </p>
        ) : null}

        <div className="mt-[13px] flex gap-[7px] items-center">
          {i > 0 ? (
            <button
              type="button"
              data-testid="tour-prev"
              onClick={() => go(-1)}
              className="border border-line bg-surface text-ink rounded-lg px-[13px] py-1.5 text-[12.5px] font-semibold hover:bg-surface-2"
            >
              ← Lùi
            </button>
          ) : null}
          <button
            type="button"
            data-testid={last ? "tour-done" : "tour-next"}
            onClick={last ? onClose : () => go(1)}
            className="border border-primary bg-primary text-white rounded-lg px-[13px] py-1.5 text-[12.5px] font-semibold hover:bg-primary-hover"
          >
            {last ? "Xong" : "Tiếp →"}
          </button>
          <button
            type="button"
            data-testid="tour-exit"
            onClick={onClose}
            className="ml-auto text-ink-3 rounded-lg px-[13px] py-1.5 text-[12.5px] font-semibold hover:text-ink"
          >
            Thoát
          </button>
        </div>
      </div>
    </>
  );
}
