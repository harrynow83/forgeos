'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Camera, CameraOff } from 'lucide-react'

export function Camera() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setLoading(false)
      setError(false)
    }
    img.onerror = () => {
      setLoading(false)
      setError(true)
    }
    img.src = '/api/camera'
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Camera View</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : loading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
            <span className="text-xs text-gray-400">
              {error ? 'Offline' : loading ? 'Loading...' : 'Live'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative aspect-video bg-gray-800">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Connecting to camera...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <CameraOff className="w-8 h-8 text-gray-500" />
              <span className="text-sm text-gray-400">Camera unavailable</span>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-xs hover:bg-gray-600"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {!loading && !error && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src="/api/camera"
            alt="Camera feed"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        )}
        
        {/* Overlay controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg text-gray-300 hover:bg-gray-700/80"
          >
            <Camera className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
