/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  /* Prototype giữ nguyên gốc của GitHub Pages; bản React đứng ở nhánh con /app/ nên mọi đường dẫn
     tài sản (js, css) phải mang đúng tiền tố đó, nếu không trang mở ra trắng. CI đặt APP_BASE;
     `npm run dev` và vitest không có biến này nên vẫn chạy ở '/' như cũ. */
  base: process.env.APP_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    /* Nới từ 5s mặc định lên 20s (06/08). Test của màn cấu hình mô phỏng người dùng gõ vào NHIỀU ô
       liên tiếp, mà mỗi lần ghi `setCfg` là một vòng validate TOÀN fixture cộng một lần render lại
       cả nhóm — chạy riêng mỗi test mất 1,3-3,2s, chạy song song cả bộ thì có test chạm 6,8s và đỏ
       vì hết giờ chứ không phải vì sai. Nới ở ĐÂY chứ không dán timeout vào từng test: đây là đặc
       tính của seam ghi, không phải của một test cụ thể, và vá lẻ thì test chậm tiếp theo lại đỏ.
       20s vẫn đủ chặt để một test treo thật bị bắt — mọi test trong repo này đều đồng bộ. */
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/data/validate.ts'],
    },
  },
})
