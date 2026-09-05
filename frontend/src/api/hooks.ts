import { useCallback, useEffect, useState } from 'react'
import { get } from '../api/client'

export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!path) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    get<T>(path)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [path])

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