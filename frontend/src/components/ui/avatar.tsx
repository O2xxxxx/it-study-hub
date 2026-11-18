import { cn, initialsOf } from '@/lib/utils'

export function Avatar({
  name,
  hue = 210,
  size = 32,
  className,
}: {
  name: string
  hue?: number
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white shadow-inner ring-1 ring-white/30',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.4)),
        background: 'linear-gradient(135deg, hsl(' + hue + ' 72% 58%), hsl(' + ((hue + 34) % 360) + ' 78% 46%))',
      }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  )
}
