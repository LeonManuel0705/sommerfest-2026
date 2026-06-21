import { createPortal } from 'react-dom'

export function PrintPortal({ children, page }: { children: React.ReactNode; page?: 'cert' }) {
  return createPortal(<div className={page === 'cert' ? 'print-portal cert-pages' : 'print-portal'}>{children}</div>, document.body)
}
