import { useEffect, useMemo, useState } from 'react'
import { createBooking, type Event } from '../api/client'
import { useAuth } from '../context/AuthContext'

const TIME_SLOTS = [
  'Morning (6 AM – 9 AM)',
  'Midday (11 AM – 2 PM)',
  'Evening (5 PM – 8 PM)',
]

function parser(s: string) {
  const dt = new Date(s)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function dateRange(start: string, end: string) {
  const from = parser(start)
  const to = parser(end ?? start)
  if (!from || !to || to < from) return from ? [start] : []
  const days: string[] = []
  const cur = new Date(from)
  while (cur <= to) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function fmtDay(d: string) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const VISITOR_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10]

export default function BookingModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const { token } = useAuth()
  const [date, setDate] = useState('')
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1])
  const [visitors, setVisitors] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ bookingId: string; date: string; timeSlot: string } | null>(null)

  const dates = useMemo(() => dateRange(event.start_date, event.end_date), [event.start_date, event.end_date])

  useEffect(() => {
    setDate((cur) => (cur && dates.includes(cur) ? cur : (dates[0] ?? '')))
  }, [dates])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!date || !name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email, phone and a date.')
      return
    }
    setSubmitting(true)
    try {
      const res = await createBooking(
        {
          event_id: event.id,
          event_name: event.name,
          date,
          time_slot: timeSlot,
          num_visitors: visitors,
          visitor_name: name.trim(),
          visitor_email: email.trim(),
          visitor_phone: phone.trim(),
        },
        token,
      )
      setConfirmed({ bookingId: res.booking_id, date, timeSlot })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking could not be completed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="booking-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Book tickets for ${event.name}`}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        {confirmed ? (
          <div className="booking-confirm">
            <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
            <h3>Booking confirmed</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>
              Your seats for <b>{event.name}</b> are reserved. A confirmation has been sent to your email.
            </p>
            <p className="booking-note">Booking ID: <span className="booking-id">{confirmed.bookingId}</span></p>
            <div className="booking-note">
              <div>Date: {fmtDay(confirmed.date)}</div>
              <div>Time slot: {confirmed.timeSlot}</div>
              <div>Visitors: {visitors}</div>
            </div>
            <div className="hero-strip">
              <button className="btn btn-sm btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <button className="booking-close" aria-label="Close" onClick={onClose}>✕</button>
            <h3>Book tickets</h3>
            <p className="booking-sub">{event.name} — {event.location}</p>

            <form onSubmit={submit}>
              <div className="booking-field">
                <label htmlFor="bk-date">Date</label>
                <select id="bk-date" value={date} onChange={(e) => setDate(e.target.value)} required>
                  {dates.map((d) => (
                    <option key={d} value={d}>{fmtDay(d)}</option>
                  ))}
                </select>
              </div>

              <div className="booking-field">
                <label htmlFor="bk-slot">Time slot</label>
                <select id="bk-slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="booking-field">
                <label htmlFor="bk-count">Number of visitors</label>
                <select id="bk-count" value={visitors} onChange={(e) => setVisitors(Number(e.target.value))}>
                  {VISITOR_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="booking-field">
                <label htmlFor="bk-name">Visitor name</label>
                <input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
              </div>

              <div className="booking-field">
                <label htmlFor="bk-email">Email</label>
                <input id="bk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>

              <div className="booking-field">
                <label htmlFor="bk-phone">Phone</label>
                <input id="bk-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" autoComplete="tel" />
              </div>

              {error && <p style={{ color: '#c0392b', fontSize: 13.5, margin: '0 0 4px' }}>{error}</p>}

              <div className="hero-strip">
                <button className="btn btn-sm btn-primary" disabled={submitting}>
                  {submitting ? 'Booking…' : 'Confirm booking →'}
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
              </div>
              <p className="booking-note">Booking requests are confirmed instantly in this prototype and will sync to the ministry booking system.</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}