import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentTheme, setTheme } from '@/lib/theme'

export function ThemeToggle() {
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
