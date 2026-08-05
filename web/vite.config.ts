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
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/data/validate.ts'],
    },
  },
})
