import { useEffect } from 'react'

/**
 * useScrollReveal
 * Simple hook that uses IntersectionObserver to add 'reveal--active' class
 * to elements with 'reveal' class when they enter the viewport.
 */
export default function useScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before it fully enters
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--active')
          // Once revealed, we can stop observing it
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    const hiddenElements = document.querySelectorAll('.reveal')
    hiddenElements.forEach((el) => observer.observe(el))

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el))
    }
  }, [])
}
