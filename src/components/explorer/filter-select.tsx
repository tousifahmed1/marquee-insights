import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = 'all'

type FilterSelectProps = {
  label: string
  value: string | undefined
  options: readonly { value: string; label: string }[]
  allLabel?: string
  layout?: 'stacked' | 'inline'
  onChange: (value: string | undefined) => void
}

export function FilterSelect({
  label,
  value,
  options,
  allLabel,
  layout = 'stacked',
  onChange,
}: FilterSelectProps) {
  const id = useId()
  const inline = layout === 'inline'
  const selected = options.find((option) => option.value === value)?.label ?? allLabel
  return (
    <div className={inline ? 'flex items-center gap-3' : 'space-y-2'}>
      <Label htmlFor={id} className={inline ? 'font-normal whitespace-nowrap text-muted-foreground' : undefined}>
        {label}
      </Label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger id={id} className={inline ? 'w-20' : 'w-full'}>
          <SelectValue>{selected}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
