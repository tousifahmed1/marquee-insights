import { Link } from '@tanstack/react-router'

export function Wordmark({ name }: { name: string }) {
  return (
    <Link
      to="/"
      className="font-display text-2xl leading-none text-foreground decoration-highlight decoration-2 underline-offset-8 hover:underline"
    >
      {name}
    </Link>
  )
}
