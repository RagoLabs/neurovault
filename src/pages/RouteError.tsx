import { isRouteErrorResponse, useRouteError, Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteError() {
  const err = useRouteError()
  const message = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : 'Unexpected error'
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="surface max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-danger/10 text-danger"><AlertTriangle /></div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground font-data break-words">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild><Link to="/">Back to dashboard</Link></Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    </div>
  )
}
