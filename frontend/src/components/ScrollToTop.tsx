import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to the top of the page only when the user actively NAVIGATES to a new
// route. On the initial mount (page reload / deep link), the browser's own
// scroll restoration is left untouched so deep routes keep their position and
// we never force a jump towards the Home hero.
export default function ScrollToTop() {
  const { pathname, search } = useLocation()
  const isFirstRender = useRef(true)

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [pathname, search])

  return null
}