import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-colors placeholder:text-gray-400',
        'focus-visible:border-teal-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
