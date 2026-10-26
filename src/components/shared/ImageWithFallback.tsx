import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageAsset } from '@/config/images'

export function ImageWithFallback({ asset, className, imgClassName, showCaption, eager }: { asset: ImageAsset | undefined; className?: string; imgClassName?: string; showCaption?: boolean; eager?: boolean }) {
  const [error, setError] = useState(false)
  if (!asset || error) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground', className)}>
        <ImageOff className="size-6" />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }
  return (
    <figure className={cn('relative overflow-hidden', className)}>
      <img src={asset.src} alt={asset.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setError(true)} className={cn('size-full object-cover', imgClassName)} />
      {asset.sample && (
        <span className="absolute left-2 top-2 rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">Sample image</span>
      )}
      {showCaption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent px-3 pb-2 pt-6 text-[11px] text-white/90">{asset.caption} · {asset.credit} ({asset.license})</figcaption>}
    </figure>
  )
}
