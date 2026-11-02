import { Button } from '@/components/ui/button'

export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border p-6">
      <p>{what} didn’t load. Check your connection and try again.</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
