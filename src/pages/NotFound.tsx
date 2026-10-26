import { Link } from 'react-router'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/PageTransition'

export function NotFound() {
  return (
    <PageTransition>
      <EmptyState icon={Compass} title="Page not found" description="The record or page you are looking for does not exist in this demonstration." action={<Button asChild><Link to="/">Back to dashboard</Link></Button>} />
    </PageTransition>
  )
}
