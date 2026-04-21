'use client'

import { motion } from 'framer-motion'
import { usePrinter } from '@/store/printerStore'
import { Activity, Thermometer, Wifi } from 'lucide-react'

export function StatusBar() {
  const { state, progress, nozzleTemp, bedTemp, connected, loading } = usePrinter()

  const getStateColor = () => {
    switch (state) {
      case 'printing': return 'text-green-400'
      case 'paused': return 'text-yellow-400'
      case 'ready': return 'text-blue-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStateText = () => {
    switch (state) {
      case 'printing': return 'Printing'
      case 'paused': return 'Paused'
      case 'ready': return 'Ready'
      case 'error': return 'Error'
      default: return 'Offline'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border-b border-gray-800 px-4 py-3"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-sm font-medium ${getStateColor()}`}>
              {loading ? 'Loading...' : getStateText()}
            </span>
          </div>
          
          {state === 'printing' && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-gray-400">{Math.round(progress * 100)}%</span>
            </div>
          )}
        </div>

        {/* Temperatures */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">
              {nozzleTemp.toFixed(0)}°C
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm" />
            <span className="text-sm text-gray-300">
              {bedTemp.toFixed(0)}°C
            </span>
          </div>
        </div>

        {/* Connection */}
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${connected ? 'text-green-400' : 'text-red-400'}`} />
          <span className="text-xs text-gray-400">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
