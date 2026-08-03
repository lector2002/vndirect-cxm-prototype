/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cam VNDIRECT — chỉ cho tương tác & định danh, không bao giờ làm màu trạng thái
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
          line: 'var(--primary-line)',
        },
        bg: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface2)' },
        line: { DEFAULT: 'var(--line)', soft: 'var(--line-soft)' },
        ink: {
          dark: 'var(--ink-dark)',
          DEFAULT: 'var(--ink)',
          2: 'var(--ink2)',
          3: 'var(--ink3)',
        },
        // 4 trạng thái — "ok/đang kiểm soát" cố ý không có màu riêng
        watch: { DEFAULT: 'var(--watch)', bg: 'var(--watch-bg)', line: 'var(--watch-line)' },
        crit: { DEFAULT: 'var(--crit)', bg: 'var(--crit-bg)', line: 'var(--crit-line)' },
        good: { DEFAULT: 'var(--good)', bg: 'var(--good-bg)', line: 'var(--good-line)' },
        unk: 'var(--unk)',
        // Tone thông tin / chưa hoàn thiện — KHÔNG phải trạng thái sức khỏe
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)', line: 'var(--info-line)' },
        // Thang PHÂN LOẠI — chỉ cho chuỗi/lát dữ liệu & intent, không bao giờ mang nghĩa trạng thái
        cat: {
          1: 'var(--cat-1)',
          2: 'var(--cat-2)',
          3: 'var(--cat-3)',
          4: 'var(--cat-4)',
          5: 'var(--cat-5)',
          other: 'var(--cat-other)',
        },
      },
      borderRadius: { DEFAULT: 'var(--radius)' },
      boxShadow: { card: 'var(--shadow)' },
      fontFamily: {
        sans: ['-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
