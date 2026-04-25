"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import { usePrinterStore } from "@/store/printerStore";

export function OfflineBanner() {
  const isOnline = usePrinterStore((state) => state.isOnline);
  const wsConnected = usePrinterStore((state) => state.wsConnected);
  const connectionStatus = usePrinterStore((state) => state.connectionStatus);
  const lastSyncTime = usePrinterStore((state) => state.lastSyncTime);

  const [isVisible, setIsVisible] = useState(false);

  // Show banner when offline or reconnecting
  useEffect(() => {
    const shouldShow = !isOnline || connectionStatus === "reconnecting" || (isOnline && !wsConnected);
    setIsVisible(shouldShow);
  }, [isOnline, wsConnected, connectionStatus]);

  const getStatusMessage = () => {
    if (!isOnline) {
      return "No internet connection";
    }
    if (connectionStatus === "reconnecting") {
      return "Reconnecting...";
    }
    if (isOnline && !wsConnected) {
      return "Connection lost";
    }
    return "";
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    if (connectionStatus === "reconnecting") {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return null;
    
    const now = Date.now();
    const diff = now - lastSyncTime;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-orange-900/90 border-b border-orange-700 px-4 py-2"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-orange-300">
                {getStatusIcon()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-orange-200">
                  {getStatusMessage()}
                </span>
                {lastSyncTime && (
                  <span className="text-xs text-orange-400">
                    Last sync: {formatLastSync()}
                  </span>
                )}
              </div>
            </div>
            
            {connectionStatus === "reconnecting" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-xs text-orange-300">
                  Attempting to reconnect...
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
