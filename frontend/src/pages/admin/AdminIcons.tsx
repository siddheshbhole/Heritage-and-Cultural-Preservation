/**
 * Line-icon set for the administration portal.
 *
 * Every icon is a 24x24 stroke glyph drawn with `currentColor` so it inherits
 * the surrounding text colour, matching the icon convention already used by
 * `AIHeritageGuide`. Emoji are deliberately avoided across the admin surface.
 */

export type AdminIconName =
  | 'overview'
  | 'heritage'
  | 'moderation'
  | 'analytics'
  | 'users'
  | 'audit'
  | 'database'
  | 'matrix'
  | 'documents'
  | 'media'
  | 'map'
  | 'guide'
  | 'search'
  | 'community'
  | 'events'
  | 'museum'
  | 'assistant'
  | 'check'
  | 'cross'
  | 'trash'
  | 'pencil'
  | 'plus'
  | 'signOut'
  | 'shield'
  | 'alert'
  | 'info'
  | 'clock'
  | 'inbox'
  | 'chevronLeft'
  | 'chevronRight'
  | 'sort'

const PATHS: Record<AdminIconName, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
    </>
  ),
  heritage: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8" />
      <path d="M3 20.5h18" />
    </>
  ),
  moderation: (
    <>
      <path d="M12 3 5 5.8V11c0 4.2 2.9 8.1 7 9.6 4.1-1.5 7-5.4 7-9.6V5.8L12 3Z" />
      <path d="M9.2 12.1 11.3 14l3.6-3.9" />
    </>
  ),
  analytics: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5V12M11 20.5V6M15.5 20.5v-5.5M20 20.5V9" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.9" />
      <path d="M17.6 14.9c1.8.7 2.9 2.4 2.9 4.6" />
    </>
  ),
  audit: (
    <>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14 3.5V8h5" />
      <path d="M8.8 12.8h7M8.8 16.3h4.6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.2" ry="3" />
      <path d="M4.8 6v12c0 1.7 3.2 3 7.2 3s7.2-1.3 7.2-3V6" />
      <path d="M4.8 12c0 1.7 3.2 3 7.2 3s7.2-1.3 7.2-3" />
    </>
  ),
  matrix: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M3.5 9.4h17M9.2 9.4V20M3.5 14.7h17M15 9.4V20" />
    </>
  ),
  documents: (
    <>
      <path d="M6.5 3.5h7L18 8v12.5H6.5z" />
      <path d="M13 3.5V8h5" />
      <path d="M9.3 12.6h5.4M9.3 16.1h3.6" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15.5 8 11l4 3.2 3-2.4 6 4.7" />
      <circle cx="8.6" cy="9.2" r="1.3" />
    </>
  ),
  map: (
    <>
      <path d="M9 4.2 3.5 6.4v13.4L9 17.6l6 2.2 5.5-2.2V4.2L15 6.4 9 4.2Z" />
      <path d="M9 4.2v13.4M15 6.4v13.4" />
    </>
  ),
  guide: (
    <>
      <circle cx="12" cy="6.4" r="2.9" />
      <path d="M7.2 20.5v-2.1c0-2.6 2.2-4.7 4.8-4.7s4.8 2.1 4.8 4.7v2.1" />
      <path d="M18.4 4.2a2.2 2.2 0 0 1 0 4.3" />
      <path d="M18.9 14.4c1.1.6 1.6 1.6 1.6 2.9" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M15.4 15.4 20 20" />
    </>
  ),
  community: (
    <>
      <path d="M12 4.2c2.6 0 4.6 2 4.6 4.5 0 3-4.6 8.1-4.6 8.1S7.4 11.7 7.4 8.7c0-2.5 2-4.5 4.6-4.5Z" />
      <circle cx="12" cy="8.6" r="1.7" />
    </>
  ),
  events: (
    <>
      <rect x="3.8" y="5" width="16.4" height="15.2" rx="2" />
      <path d="M3.8 9.6h16.4M8.2 3.2v3.6M15.8 3.2v3.6" />
      <path d="M7.6 13.2h3M13.4 13.2h3M7.6 16.8h3" />
    </>
  ),
  museum: (
    <>
      <path d="M3.5 8.5 12 4l8.5 4.5" />
      <path d="M5 20.5h14" />
      <path d="M6.6 9.5v9M10.2 9.5v9M13.8 9.5v9M17.4 9.5v9" />
    </>
  ),
  assistant: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 7V4.2" />
      <circle cx="12" cy="3.4" r="1.4" />
      <path d="M8.8 12v1.6M15.2 12v1.6" />
    </>
  ),
  check: <path d="M5 12.8 9.6 17.2 19 6.8" />,
  cross: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  trash: (
    <>
      <path d="M4.6 6.8h14.8" />
      <path d="M9.2 6.8V4.6h5.6v2.2" />
      <path d="M6.6 6.8 7.5 20h9l.9-13.2" />
      <path d="M10.4 10.4v5.8M13.6 10.4v5.8" />
    </>
  ),
  pencil: (
    <>
      <path d="M16.2 4.4a2 2 0 0 1 2.8 2.8L8.6 17.6l-3.8 1 1-3.8L16.2 4.4Z" />
      <path d="M14.4 6.2 17.8 9.6" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  signOut: (
    <>
      <path d="M14.5 4.5h-8A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5h8" />
      <path d="M17 8.2 20.8 12 17 15.8" />
      <path d="M20.4 12H9.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.8V11c0 4.2 2.9 8.1 7 9.6 4.1-1.5 7-5.4 7-9.6V5.8L12 3Z" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.2 2.8 20h18.4L12 4.2Z" />
      <path d="M12 10v4.4" />
      <circle cx="12" cy="17.1" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13.5h4l1.6 2.6h5.8l1.6-2.6h4" />
      <path d="M5.6 5.4h12.8l2.1 8.1v4a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-4L5.6 5.4Z" />
    </>
  ),
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevronRight: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  sort: (
    <>
      <path d="M7 4.5v15M7 4.5 4 7.6M7 4.5l3 3.1" />
      <path d="M17 19.5v-15M17 19.5l-3-3.1M17 19.5l3-3.1" />
    </>
  ),
}

export function AdminIcon({
  name,
  size = 18,
  className,
  strokeWidth = 1.7,
}: {
  name: AdminIconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {PATHS[name]}
    </svg>
  )
}
