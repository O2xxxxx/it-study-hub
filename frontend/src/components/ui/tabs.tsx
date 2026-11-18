import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'relative inline-flex h-10 items-center gap-1 rounded-xl border border-border/70 bg-muted/60 p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { indicatorId?: string }
>(({ className, children, indicatorId = 'tabs-indicator', ...props }, ref) => {
  const [active, setActive] = React.useState(false)
  const inner = React.useRef<HTMLButtonElement | null>(null)
  React.useEffect(() => {
    const node = inner.current
    if (!node) return
    const update = () => setActive(node.getAttribute('data-state') === 'active')
    update()
    const observer = new MutationObserver(update)
    observer.observe(node, { attributes: true, attributeFilter: ['data-state'] })
    return () => observer.disconnect()
  }, [])
  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        inner.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      }}
      className={cn(
        'relative z-[1] inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[state=active]:text-foreground',
        className,
      )}
      {...props}
    >
      {active ? (
        <motion.span
          layoutId={indicatorId}
          className="absolute inset-0 -z-[1] rounded-lg bg-card shadow-sm ring-1 ring-border/70"
          transition={spring.snappy}
        />
      ) : null}
      {children}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 focus-visible:outline-none', className)}
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
