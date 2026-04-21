import { create } from 'zustand'
import { useEffect } from 'react'

interface PrinterState {
  state: 'ready' | 'printing' | 'paused' | 'offline' | 'error'
  progress: number
  nozzleTemp: number
  bedTemp: number
  connected: boolean
  loading: boolean
  
  // Actions
  updateStatus: (status: Partial<PrinterState>) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  state: 'offline' as const,
  progress: 0,
  nozzleTemp: 0,
  bedTemp: 0,
  connected: false,
  loading: true,
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
  ...initialState,
  
  updateStatus: (status) => set((state) => ({ ...state, ...status })),
  
  setLoading: (loading) => set({ loading }),
  
  reset: () => set(initialState),
}))

// Auto-polling hook
export function usePrinterPolling() {
  const { updateStatus, setLoading } = usePrinterStore()
  
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/printer/status')
        const data = await res.json()
        
        if (data.success) {
          updateStatus({
            state: data.state || 'offline',
            progress: data.progress || 0,
            nozzleTemp: data.nozzle || 0,
            bedTemp: data.bed || 0,
            connected: true,
            loading: false,
          })
        } else {
          updateStatus({
            connected: false,
            loading: false,
          })
        }
      } catch (error) {
        updateStatus({
          connected: false,
          loading: false,
        })
      }
    }
    
    poll()
    const interval = setInterval(poll, 1000)
    
    return () => clearInterval(interval)
  }, [updateStatus, setLoading])
}
