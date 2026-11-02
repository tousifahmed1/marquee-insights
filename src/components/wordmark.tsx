import { Link } from '@tanstack/react-router'

export function Wordmark({ name }: { name: string }) {
  return (
    <Link
      to="/"
      className="font-display text-2xl leading-none text-foreground"
    >
      {name}
    </Link>
  )
}
