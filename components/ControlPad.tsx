'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home } from 'lucide-react'

export function ControlPad() {
  const [isMoving, setIsMoving] = useState(false)

  const handleMove = async (axis: 'x' | 'y' | 'z', value: number) => {
    if (isMoving) return
    
    setIsMoving(true)
    try {
      const res = await fetch('/api/printer/jog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [axis]: value, speed: 3000 })
      })
      
      if (!res.ok) throw new Error('Move failed')
    } catch (error) {
      console.error('Move error:', error)
    } finally {
      setTimeout(() => setIsMoving(false), 100)
    }
  }

  const handleHome = async () => {
    if (isMoving) return
    
    setIsMoving(true)
    try {
      const res = await fetch('/api/printer/home', { method: 'POST' })
      if (!res.ok) throw new Error('Home failed')
    } catch (error) {
      console.error('Home error:', error)
    } finally {
      setTimeout(() => setIsMoving(false), 2000)
    }
  }

  const ControlButton = ({ children, onPress, disabled = false }: any) => (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      onClick={onPress}
      disabled={disabled || isMoving}
      className={`
        w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700
        flex items-center justify-center text-gray-300
        transition-all duration-200
        ${disabled || isMoving 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-700 hover:border-gray-600 active:bg-gray-600'
        }
      `}
    >
      {children}
    </motion.button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900 rounded-3xl border border-gray-800 p-6"
    >
      <h3 className="text-sm font-medium text-gray-400 mb-4 text-center">Movement Control</h3>
      
      {/* XY Control */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
          <div />
          <ControlButton onPress={() => handleMove('y', 10)}>
            <ArrowUp className="w-5 h-5" />
          </ControlButton>
          <div />
          
          <ControlButton onPress={() => handleMove('x', -10)}>
            <ArrowLeft className="w-5 h-5" />
          </ControlButton>
          <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
          </div>
          <ControlButton onPress={() => handleMove('x', 10)}>
            <ArrowRight className="w-5 h-5" />
          </ControlButton>
          
          <div />
          <ControlButton onPress={() => handleMove('y', -10)}>
            <ArrowDown className="w-5 h-5" />
          </ControlButton>
          <div />
        </div>
      </div>

      {/* Z Control */}
      <div className="mb-6">
        <div className="flex justify-center gap-2">
          <ControlButton onPress={() => handleMove('z', 5)}>
            <ArrowUp className="w-4 h-4" />
            <span className="text-xs ml-1">Z+</span>
          </ControlButton>
          <ControlButton onPress={() => handleMove('z', -5)}>
            <ArrowDown className="w-4 h-4" />
            <span className="text-xs ml-1">Z-</span>
          </ControlButton>
        </div>
      </div>

      {/* Home Button */}
      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: isMoving ? 1 : 0.95 }}
          whileHover={{ scale: isMoving ? 1 : 1.05 }}
          onClick={handleHome}
          disabled={isMoving}
          className={`
            px-6 py-3 rounded-2xl bg-blue-600 border border-blue-500
            flex items-center gap-2 text-white font-medium
            transition-all duration-200
            ${isMoving 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-blue-500 active:bg-blue-700'
            }
          `}
        >
          <Home className="w-4 h-4" />
          Home
        </motion.button>
      </div>
    </motion.div>
  )
}
