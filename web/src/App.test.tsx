import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from './App'

test('render app: mặc định điều hướng tới Tổng quan CXM', () => {
  render(<App />)
  // '/cxm' giờ render OverviewPage (S2.4) thay Placeholder. Hero (kick label + h1 lead() + intro)
  // đã CẮT theo quyết định owner 01/08 (Worker Contract S2.5, docs/REDESIGN-PLAN-HANDOFF.md dòng
  // 27) — 'overview-kick' không còn tồn tại. Kiểm bằng set mặc định (b-cxm-exec) render được thay
  // thế cho phép kiểm cũ dựa vào kick label.
  expect(screen.getByText('Điều hành CX')).toBeInTheDocument()
})
