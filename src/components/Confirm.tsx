import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

let showFn: ((o: ConfirmOptions) => Promise<boolean>) | null = null

/** Boîte de confirmation basée sur promesse. */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  if (showFn) return showFn(opts)
  return Promise.resolve(window.confirm(opts.title))
}

export function ConfirmHost() {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (b: boolean) => void } | null>(null)

  useEffect(() => {
    showFn = (opts) =>
      new Promise<boolean>((resolve) => {
        setState({ opts, resolve })
      })
    return () => {
      showFn = null
    }
  }, [])

  const close = (result: boolean) => {
    state?.resolve(result)
    setState(null)
  }

  return (
    <Sheet
      open={!!state}
      onClose={() => close(false)}
      title={state?.opts.title ?? ''}
      footer={
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={() => close(false)}>
            {state?.opts.cancelLabel ?? 'Annuler'}
          </button>
          <button
            className={`btn ${state?.opts.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => close(true)}
          >
            {state?.opts.confirmLabel ?? 'Confirmer'}
          </button>
        </div>
      }
    >
      {state?.opts.message && <p className="confirm-message">{state.opts.message}</p>}
    </Sheet>
  )
}
