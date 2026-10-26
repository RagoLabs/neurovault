import { useEffect } from 'react'
import { brand } from '@/config/surgeon'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${brand.name}`
  }, [title])
}
