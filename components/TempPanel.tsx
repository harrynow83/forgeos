'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { usePrinter } from '@/store/printerStore'
import { Thermometer, Snowflake } from 'lucide-react'

export function TempPanel() {
  const { nozzle: nozzleTemp, bed: bedTemp } = usePrinter()
  const [nozzleTarget, setNozzleTarget] = useState('')
  const [bedTarget, setBedTarget] = useState('')
  const [setting, setSetting] = useState(false)

  const setTemperature = async (heater: 'nozzle' | 'bed', temp: number) => {
    if (setting) return
    
    setSetting(true)
    try {
      const res = await fetch(`/api/printer/${heater}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp })
      })
      
      if (!res.ok) throw new Error('Temperature set failed')
    } catch (error) {
      console.error('Temperature error:', error)
    } finally {
      setTimeout(() => setSetting(false), 500)
    }
  }

  const cooldown = async () => {
    if (setting) return
    
    setSetting(true)
    try {
      await Promise.all([
        fetch('/api/printer/nozzle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp: 0 })
        }),
        fetch('/api/printer/bed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp: 0 })
        })
      ])
      
      setNozzleTarget('')
      setBedTarget('')
    } catch (error) {
      console.error('Cooldown error:', error)
    } finally {
      setTimeout(() => setSetting(false), 500)
    }
  }

  const TempControl = ({ 
    label, 
    current, 
    target, 
    setTarget, 
    icon: Icon, 
    color 
  }: {
    label: string
    current: number
    target: string
    setTarget: (value: string) => void
    icon: any
    color: string
  }) => (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">{current.toFixed(0)}</span>
        <span className="text-sm text-gray-400">°C</span>
        {target && (
          <span className="text-xs text-gray-500">/ {target}°C</span>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target"
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => target && setTemperature(label.toLowerCase() as 'nozzle' | 'bed', parseFloat(target))}
          disabled={!target || setting}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
        >
          Set
        </motion.button>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-900 rounded-3xl border border-gray-800 p-6"
    >
      <h3 className="text-sm font-medium text-gray-400 mb-4">Temperature Control</h3>
      
      <div className="space-y-4">
        <TempControl
          label="Nozzle"
          current={nozzleTemp}
          target={nozzleTarget}
          setTarget={setNozzleTarget}
          icon={Thermometer}
          color="text-orange-400"
        />
        
        <TempControl
          label="Bed"
          current={bedTemp}
          target={bedTarget}
          setTarget={setBedTarget}
          icon={Thermometer}
          color="text-blue-400"
        />
      </div>
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={cooldown}
        disabled={setting}
        className="w-full mt-4 px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
      >
        <Snowflake className="w-4 h-4" />
        Cooldown
      </motion.button>
    </motion.div>
  )
}
