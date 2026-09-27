import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to the top of the page only when the user actively NAVIGATES to a new
// route. On the initial mount (page reload / deep link), the browser's own
// scroll restoration is left untouched so deep routes keep their position and
// we never force a jump towards the Home hero.
// A navigation can opt into a smooth glide to the top (instead of the default
// instant jump) by calling requestSmoothTopScroll() before navigating.
const SMOOTH_TOP_FLAG = 'ss-smooth-top'

export function requestSmoothTopScroll() {
  try {
    sessionStorage.setItem(SMOOTH_TOP_FLAG, '1')
  } catch {
    /* storage unavailable — falls back to the instant jump */
  }
}

export default function ScrollToTop() {
  const { pathname, search } = useLocation()
  const isFirstRender = useRef(true)

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    let smooth = false
    try {
      smooth = sessionStorage.getItem(SMOOTH_TOP_FLAG) === '1'
      sessionStorage.removeItem(SMOOTH_TOP_FLAG)
    } catch {
      /* ignore */
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [pathname, search])

  return null
}