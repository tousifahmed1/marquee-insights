import { Link } from '@tanstack/react-router'

export function Wordmark() {
  return (
    <Link
      to="/"
      className="font-display text-2xl leading-none text-foreground"
    >
      Marquee Insights
    </Link>
  )
}
