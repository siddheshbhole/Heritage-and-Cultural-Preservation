import type { ReactNode } from 'react'
import { AdminIcon } from './AdminIcons'
import type { AdminIconName } from './AdminIcons'

type NoticeTone = 'error' | 'success' | 'info'

const NOTICE_ICON: Record<NoticeTone, AdminIconName> = {
  error: 'alert',
  success: 'check',
  info: 'info',
}

export function AdminNotice({
  tone = 'error',
  children,
}: {
  tone?: NoticeTone
  children: ReactNode
}) {
  return (
    <div className={`admin-note admin-note-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <AdminIcon name={NOTICE_ICON[tone]} size={17} />
      <p>{children}</p>
    </div>
  )
}

export function AdminPanelHead({
  title,
  sub,
  actions,
}: {
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div className="admin-panel-head">
      <div>
        <h3 className="admin-panel-title">{title}</h3>
        {sub && <span className="admin-panel-sub">{sub}</span>}
      </div>
      {actions}
    </div>
  )
}

export function AdminPager({
  page,
  pages,
  total,
  unit,
  onPrev,
  onNext,
}: {
  page: number
  pages: number
  total: number
  unit: string
  onPrev: () => void
  onNext: () => void
}) {
  if (pages <= 1) return null
  return (
    <div className="admin-pager">
      <div>
        Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} {unit} total)
      </div>
      <div className="admin-pager-actions">
        <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={onPrev}>
          <AdminIcon name="chevronLeft" size={14} /> Previous
        </button>
        <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={onNext}>
          Next <AdminIcon name="chevronRight" size={14} />
        </button>
      </div>
    </div>
  )
}

export function adminStatusClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'admin-badge admin-badge-approved'
    case 'REJECTED':
    case 'DELETE':
      return 'admin-badge admin-badge-rejected'
    case 'PENDING':
    case 'REJECT':
      return 'admin-badge admin-badge-pending'
    case 'CREATE':
    case 'UPDATE':
      return 'admin-badge admin-badge-info'
    default:
      return 'admin-badge admin-badge-neutral'
  }
}
