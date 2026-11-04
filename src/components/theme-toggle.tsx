import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { getCurrentTheme, setTheme, syncThemeColor } from '@/lib/theme'

export function ThemeToggle() {
  // The server renders the default theme's colour; match a saved choice.
  useEffect(() => syncThemeColor(getCurrentTheme()), [])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark')}
    >
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
      <span className="sr-only">
        <span className="hidden dark:inline">Switch to light theme</span>
        <span className="dark:hidden">Switch to dark theme</span>
      </span>
    </Button>
  )
}
