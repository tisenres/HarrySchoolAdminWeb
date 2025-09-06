import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toast: (props: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = React.useCallback((props: ToastProps) => {
    // Simple console log for now - in production, you'd show actual toast notifications
    console.log("Toast:", props)
    
    // You can also use browser notifications or a toast library here
    if (typeof window !== 'undefined') {
      const message = `${props.title}${props.description ? ': ' + props.description : ''}`
      
      // Create a simple toast element
      const toastEl = document.createElement('div')
      toastEl.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 ${
        props.variant === 'destructive' ? 'bg-red-600' : 'bg-green-600'
      }`
      toastEl.textContent = message
      document.body.appendChild(toastEl)
      
      // Remove after 3 seconds
      setTimeout(() => {
        toastEl.remove()
      }, 3000)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    // Return a mock toast function when not in provider
    return {
      toast: (props: ToastProps) => {
        console.log("Toast (no provider):", props)
      }
    }
  }
  return context
}

export { toast } from './toaster'