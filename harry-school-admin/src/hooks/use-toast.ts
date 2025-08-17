import * as React from "react"

type ToastActionElement = React.ReactElement

export interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = String(toastCount++)
    const newToast = { ...props, id }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
    
    return {
      id,
      dismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
    }
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prev) => {
      if (toastId) {
        return prev.filter((t) => t.id !== toastId)
      }
      return []
    })
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}