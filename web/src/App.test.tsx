import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from './App'
import { HOME_ROUTE, navLabel } from './nav.tsx'

/* Mặc định TỪNG là '/cxm' (Tổng quan CXM). Owner chốt 17/08 chỉ ba màn thuộc MVP nhỏ và làm mờ mười
   màn còn lại — `cxm` nằm trong nhóm mờ, nên mở app vào đó là tự mâu thuẫn ngay ở lần tải đầu.
   Kiểm bằng `HOME_ROUTE` + `navLabel()` chứ không gõ tên màn: đổi màn chủ thì test đi theo, còn
   route mặc định trỏ ra ngoài `NAV_GROUPS` thì `navLabel` NÉM và test đỏ. */
test('render app: mặc định điều hướng tới màn chủ của MVP', () => {
  render(<App />)
  expect(screen.getByTestId('page-title')).toHaveTextContent(navLabel(HOME_ROUTE))
})
