import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatSql } from '@/lib/format-sql'

export function SqlPanel({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false)
  const formatted = formatSql(sql)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <details className="group mt-6 rounded-lg border">
      <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span>
          <span className="group-open:hidden">Show SQL</span>
          <span className="hidden group-open:inline">Hide SQL</span>
        </span>
        <span className="text-xs text-muted-foreground">Read-only, 3 s timeout</span>
      </summary>
      <div className="border-t px-4 py-3">
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={copy} aria-live="polite">
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? 'Copied' : 'Copy SQL'}
          </Button>
        </div>
        <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre">
          <code>{formatted}</code>
        </pre>
      </div>
    </details>
  )
}
