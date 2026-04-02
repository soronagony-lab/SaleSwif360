import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='system-ui' font-size='14'%3EImage%3C/text%3E%3C/svg%3E"

export function ProductImage({ src, alt, className, ...props }) {
  const initial = src || PLACEHOLDER
  return (
    <img
      key={initial}
      src={initial}
      alt={alt || ''}
      className={cn(className)}
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = PLACEHOLDER
      }}
      {...props}
    />
  )
}

export function ProductImagePlaceholder({ className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gray-100 text-gray-400',
        className
      )}
    >
      <ImageIcon className="h-10 w-10" />
    </div>
  )
}
