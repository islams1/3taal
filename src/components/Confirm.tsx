import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Options = {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
}

type Pending = Options & { resolve: (ok: boolean) => void }

const ConfirmContext = createContext<(o: Options) => Promise<boolean>>(async () => false)

/** In-app replacement for window.confirm(): `if (await confirm({ title })) ...` */
export const useConfirm = () => useContext(ConfirmContext)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const ref = useRef<HTMLDialogElement>(null)
  const okRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback(
    (o: Options) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })),
    [],
  )

  // showModal puts it in the top layer, so it also sits above an open day popup
  useEffect(() => {
    if (pending && !ref.current?.open) {
      ref.current?.showModal()
      okRef.current?.focus()
    }
  }, [pending])

  const answer = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
    ref.current?.close()
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={ref}
        className="confirm"
        aria-labelledby="confirm-title"
        onCancel={(e) => { e.preventDefault(); answer(false) }}
        onClick={(e) => e.target === e.currentTarget && answer(false)}
      >
        {pending && (
          <div className="confirm-box">
            <span className="confirm-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            </span>
            <h2 id="confirm-title">{pending.title}</h2>
            {pending.message && <p>{pending.message}</p>}
            <div className="confirm-actions">
              <button type="button" className="logbtn" onClick={() => answer(false)}>{pending.cancelText ?? 'Cancel'}</button>
              <button type="button" className="finish" ref={okRef} onClick={() => answer(true)}>{pending.confirmText ?? 'OK'}</button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}
