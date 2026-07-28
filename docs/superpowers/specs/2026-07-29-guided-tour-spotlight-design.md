# Thiết kế lại "Chạy bản giới thiệu" — Spotlight coach-mark

> Ngày: 2026-07-29 · Phạm vi: `output/cxm-platform-prototype.html` · Level: Small

## Vấn đề
Bản giới thiệu hiện tại là ribbon 6 bước trên đỉnh, kể **câu chuyện nghiệp vụ** xuyên các màn
(gãy ở đâu → khách nói gì → ai xử lý) nhưng **không chỉ vào từng component**, nên người xem không
biết mỗi khối trên màn là gì và đọc thế nào.

## Quyết định
Chuyển sang **tour spotlight coach-mark**: mỗi bước làm tối nền, khoét sáng đúng một component
thật trên màn và hiện popover giải thích *component đó là gì · đọc thế nào*. Người dùng bấm
**← Lùi / Tiếp →** để chuyển bước, **Thoát / Esc** để dừng.

- **Độ phủ:** 6 màn cốt lõi (`cxm` `atlas` `voc` `sources` `vocjourney` `work`), ~2-3 stop/màn,
  tổng **15 stop**.
- **Giữ nguyên:** nút "▶ Chạy bản giới thiệu" ở đáy sidebar; toàn bộ logic màn; alias route.

## Cơ chế (không thư viện ngoài)
- `#tourmask` phủ toàn màn (bắt click để không bấm nhầm ra ngoài tour).
- `#tourhole` đặt đúng rect component (`getBoundingClientRect`), khoét sáng bằng
  `box-shadow: 0 0 0 9999px rgba(...)` + viền cam.
- `#tourpop` neo cạnh component (dưới → trên → giữa theo chỗ trống, kẹp trong viewport).
- Vẽ sau mỗi `render()` bằng `requestAnimationFrame(tourShow)`; nghe `resize` để đặt lại.

## Anchor (thêm `data-tour` vào template)
| Màn | Stop | Anchor |
|---|---|---|
| cxm | Bộ chọn set · Top ưu tiên · Kết quả đo | `setchips` · `blk-@toppri` · `blk-@outcomes` |
| atlas | Rail 6 phase · Xương sống + dải nối · Hồ sơ bước 3 tab | `atlas-prail` · `atlas-spine` · `atlas-inspector` |
| voc | 4 intent · 3 làn bất thường | `blk-@intent` · `blk-@anomlanes` |
| sources | Bảng 7 nguồn + SLA · Hồ sơ 1 nguồn | `src-table` · `src-profile` |
| vocjourney | Tiếng nói theo điểm chạm · Tab Verbatim | `voc-spine` · `voc-inspector` |
| work | 4 làn · Cổng duyệt · Làn verify | `work-lanes` · `work-lane-approve` · `work-lane-verify` |

## An toàn / prep
- `tourPrep(stop)` đặt state để anchor chắc chắn tồn tại: set mặc định cho cxm/voc, flow pilot
  `f-open-2026` cho atlas, `srcTab=health` + mở `src-zalo` cho stop hồ sơ nguồn, `work=lanes`,
  `vocPhase=p2` + `vocTab=verb` cho stop Verbatim.
- **Fallback:** selector không tìm thấy → popover về giữa màn, tour không vỡ.
- `validateFixture()`: giữ kiểm `r` là route thật, thêm cảnh báo stop thiếu `sel`/`grp`.
