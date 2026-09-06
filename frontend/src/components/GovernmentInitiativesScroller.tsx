import { useCallback, useEffect, useRef, useState } from 'react'
import slide01 from '../../../ima/01.jpg.jpg'
import slide02 from '../../../ima/02.jpg.jpg'
import slide03 from '../../../ima/03.jpg.jpg'
import slide04 from '../../../ima/04.jpg.jpg'
import slide05 from '../../../ima/05.jpg.jpeg'
import slide06 from '../../../ima/06.jpg.jpeg'
import slide07 from '../../../ima/07.jpg.jpeg'
import slide08 from '../../../ima/08.jpg.png'

const slides = [slide01, slide02, slide03, slide04, slide05, slide06, slide07, slide08]
const realCount = slides.length
const trackSlides = [...slides, slides[0]]

export default function GovernmentInitiativesScroller() {
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [timerKey, setTimerKey] = useState(0)

  const pointerIdRef = useRef<number | null>(null)
  const dragStartRef = useRef<number | null>(null)
  const dragDeltaRef = useRef(0)

  const restartTimer = useCallback(() => setTimerKey((k) => k + 1), [])

  const goNext = useCallback(() => {
    if (index >= realCount) {
      setAnimate(false)
      setIndex(0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    } else {
      setAnimate(true)
      setIndex(index + 1)
    }
    restartTimer()
  }, [index, realCount, restartTimer])

  const goPrev = useCallback(() => {
    if (index === 0) {
      setAnimate(false)
      setIndex(realCount)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true)
          setIndex(realCount - 1)
        })
      })
    } else {
      setAnimate(true)
      setIndex(index - 1)
    }
    restartTimer()
  }, [index, realCount, restartTimer])

  const handleTransitionEnd = useCallback(() => {
    if (index === realCount) {
      setAnimate(false)
      setIndex(0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    }
  }, [index, realCount])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => goNext(), 3000)
    return () => window.clearInterval(id)
  }, [paused, goNext, timerKey])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointerIdRef.current = e.pointerId
      dragStartRef.current = e.clientX
      dragDeltaRef.current = 0
      setDragOffset(0)
      setPaused(true)
      setAnimate(false)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || dragStartRef.current === null) return
    dragDeltaRef.current = e.clientX - dragStartRef.current
    setDragOffset(dragDeltaRef.current)
  }, [])

  const endDrag = useCallback(() => {
    if (pointerIdRef.current === null) return
    pointerIdRef.current = null
    dragStartRef.current = null
    const delta = dragDeltaRef.current
    dragDeltaRef.current = 0
    setDragOffset(0)
    setAnimate(true)
    setPaused(false)
    const threshold = Math.min(window.innerWidth * 0.15, 96)
    if (Math.abs(delta) > threshold) {
      if (delta < 0) goNext()
      else goPrev()
    }
  }, [goNext, goPrev])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    },
    [goNext, goPrev],
  )

  return (
    <section className="section gov-initiatives">
      <div
        className="gov-slider"
        role="region"
        aria-roledescription="carousel"
        aria-label="Government initiatives"
        onKeyDown={handleKeyDown}
      >
        <div
          className="gov-slider-viewport"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`gov-slider-track${animate ? '' : ' no-anim'}`}
            style={{ transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))` }}
            onTransitionEnd={handleTransitionEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            tabIndex={0}
          >
            {trackSlides.map((src, i) => (
              <div className="gov-slide" key={i}>
                <img src={src} alt={`Government initiative ${i >= realCount ? 1 : i + 1}`} draggable={false} />
              </div>
            ))}
          </div>
          <button type="button" className="gov-slider-arrow prev" aria-label="Previous slide" onClick={goPrev}>
            ‹
          </button>
          <button type="button" className="gov-slider-arrow next" aria-label="Next slide" onClick={goNext}>
            ›
          </button>
        </div>
      </div>
    </section>
  )
}