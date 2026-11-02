import { useEffect } from 'react'

// Marks <html data-hydrated> once React is interactive, so e2e tests can wait
// for hydration instead of racing it.
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true'
  }, [])
  return null
}
