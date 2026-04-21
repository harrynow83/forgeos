"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square } from "lucide-react";
import { StatusBar } from "@/components/StatusBar";
import { ControlPad } from "@/components/ControlPad";
import { TempPanel } from "@/components/TempPanel";
import { Camera } from "@/components/Camera";
import { FileList } from "@/components/FileList";
import { usePrinterStore, usePrinterPolling } from "@/store/printerStore";
import { useToast } from "@/components/ToastProvider";

export default function ControlPage() {
  usePrinterPolling()
  const { state, progress, connected } = usePrinterStore()
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState(false)

  const handlePrintAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (actionLoading) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/printer/${action}`, { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        toast(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`, 'success')
      } else {
        toast(`${action} failed`, 'error')
      }
    } catch (error) {
      toast(`${action} failed`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <StatusBar />
      
      <div className="p-4 max-w-7xl mx-auto">
        {/* Print Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-3xl border border-gray-800 p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                state === 'printing' ? 'bg-green-500' : 
                state === 'paused' ? 'bg-yellow-500' : 
                state === 'ready' ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm font-medium text-white capitalize">
                {state === 'printing' ? 'Printing' : 
                 state === 'paused' ? 'Paused' : 
                 state === 'ready' ? 'Ready' : 'Offline'}
              </span>
            </div>
            
            <div className="flex gap-2">
              {state === 'printing' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handlePrintAction('pause')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50"
                >
                  <Pause className="w-4 h-4 inline mr-2" />
                  Pause
                </motion.button>
              )}
              
              {state === 'paused' && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handlePrintAction('resume')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    Resume
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handlePrintAction('cancel')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 disabled:opacity-50"
                  >
                    <Square className="w-4 h-4 inline mr-2" />
                    Cancel
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Camera */}
          <div className="lg:col-span-1">
            <Camera />
          </div>

          {/* Middle Column - Controls */}
          <div className="lg:col-span-1 space-y-4">
            <ControlPad />
            <TempPanel />
          </div>

          {/* Right Column - Files */}
          <div className="lg:col-span-1">
            <FileList />
          </div>
        </div>
      </div>
    </div>
  )
}
