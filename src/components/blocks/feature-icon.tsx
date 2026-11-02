import {
  ChartColumn,
  Clock,
  Film,
  Gamepad2,
  Globe,
  Layers,
  MessageSquare,
  Search,
  TrendingUp,
  Trophy,
  Tv,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { FeatureIcon as FeatureIconName } from '@/content'

const ICONS: Record<FeatureIconName, LucideIcon> = {
  chart: ChartColumn,
  users: Users,
  tv: Tv,
  film: Film,
  gamepad: Gamepad2,
  trophy: Trophy,
  search: Search,
  globe: Globe,
  clock: Clock,
  'trending-up': TrendingUp,
  layers: Layers,
  message: MessageSquare,
}

export function FeatureIcon({ name, className }: { name: FeatureIconName; className?: string }) {
  const Icon = ICONS[name]
  return <Icon aria-hidden className={className} />
}
