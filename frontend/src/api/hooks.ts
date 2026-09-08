import { useCallback, useEffect, useState } from 'react'
import { get } from '../api/client'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface FetchOptions {
  retries?: number
}

export function useFetch<T>(path: string | null, options: FetchOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!path) {
      setLoading(false)
      return
    }
    let cancelled = false
    const retries = options.retries ?? 2

    const attempt = async (remaining: number) => {
      setLoading(true)
      setError(null)
      try {
        const d = await get<T>(path)
        if (!cancelled) setData(d)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        const retriable = remaining > 0 && /status (5\d\d)|Cannot reach/.test(message)
        if (retriable) {
          await sleep(400 * (retries - remaining + 1))
          if (!cancelled) return attempt(remaining - 1)
        }
        if (!cancelled) {
          setData(null)
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    attempt(retries)
    return () => {
      cancelled = true
    }
  }, [path, options.retries])

  useEffect(() => reload(), [reload])

  return { data, loading, error, reload }
}

export function withQuery(base: string, params: Record<string, string | number | undefined | null>) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `${base}?${qs}` : base
}