'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProviderProps {
  children: React.ReactNode
  options?: {
    duration?: number
    smoothWheel?: boolean
    wheelMultiplier?: number
    touchMultiplier?: number
    infinite?: boolean
  }
}

export function SmoothScrollProvider({
  children,
  options = {}
}: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const lenis = new Lenis({
      duration: options.duration ?? 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: options.smoothWheel ?? true,
      wheelMultiplier: options.wheelMultiplier ?? 1,
      touchMultiplier: options.touchMultiplier ?? 2,
      infinite: options.infinite ?? false,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Expose lenis to window for external access if needed
    // @ts-expect-error - Custom window property
    window.lenis = lenis

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [options])

  return <>{children}</>
}

// Hook to access Lenis instance
export function useLenis() {
  // @ts-expect-error - Custom window property
  return typeof window !== 'undefined' ? window.lenis as Lenis | undefined : undefined
}

// Utility to scroll to element
export function scrollToElement(selector: string, offset = 0) {
  const element = document.querySelector(selector) as HTMLElement | null
  if (element) {
    const lenis = useLenis()
    if (lenis) {
      lenis.scrollTo(element, { offset })
    } else {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// Utility to scroll to top
export function scrollToTop() {
  const lenis = useLenis()
  if (lenis) {
    lenis.scrollTo(0)
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
