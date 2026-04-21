'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { File, Play, Trash2, RefreshCw } from 'lucide-react'

interface FileItem {
  filename: string
  size: number
  modified: string
}

export function FileList() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      
      if (data.success) {
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Files fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const startPrint = async (filename: string) => {
    if (printing) return
    
    setPrinting(true)
    try {
      const res = await fetch('/api/printer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      })
      
      if (res.ok) {
        setSelectedFile(filename)
      }
    } catch (error) {
      console.error('Print start error:', error)
    } finally {
      setPrinting(false)
    }
  }

  const deleteFile = async (filename: string) => {
    if (printing) return
    
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filename })
      })
      
      if (res.ok) {
        setFiles(files.filter(f => f.filename !== filename))
        if (selectedFile === filename) {
          setSelectedFile('')
        }
      }
    } catch (error) {
      console.error('File delete error:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-900 rounded-3xl border border-gray-800 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Files</h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={fetchFiles}
          disabled={loading}
          className="p-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8">
          <File className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No files found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((file) => (
            <motion.div
              key={file.filename}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              className={`p-3 rounded-lg border transition-colors ${
                selectedFile === file.filename
                  ? 'bg-blue-900/30 border-blue-600'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => startPrint(file.filename)}
                    disabled={printing}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3 h-3" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => deleteFile(file.filename)}
                    disabled={printing}
                    className="p-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded-lg"
        >
          <p className="text-sm text-blue-300">
            Printing: {selectedFile}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
