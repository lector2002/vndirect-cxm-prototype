import '@testing-library/jest-dom'

/* jsdom không cài `Element.scrollIntoView` (nó không có layout nên không có gì để cuộn). Vá ở ĐÂY
   chứ không vá trong component: cuộn tới chỗ đang được tô sáng là hành vi đúng của coach-mark trên
   trình duyệt thật, bọc nó bằng `typeof … === 'function'` chỉ để test xanh là để lỗ hổng của môi
   trường test viết lại code chạy thật. */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}
