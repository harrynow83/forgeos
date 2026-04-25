"use client";

import { useEffect, useState } from "react";
import { getStatus, PrinterStatus } from "@/lib/api";
import { usePrinterStore } from "@/store/printerStore";

interface UsePrinterStatusOptions {
  enabled?: boolean;
}

export function usePrinterStatus(options: UsePrinterStatusOptions = {}) {
  const { enabled = true } = options;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get real-time status from Zustand store (updated via WebSocket)
  const printerState = usePrinterStore((state) => state.state);
  const progress = usePrinterStore((state) => state.progress);
  const nozzleTemp = usePrinterStore((state) => state.nozzleTemp);
  const bedTemp = usePrinterStore((state) => state.bedTemp);
  const connected = usePrinterStore((state) => state.connected);
  const wsConnected = usePrinterStore((state) => state.wsConnected);

  // Initial status fetch for backward compatibility
  useEffect(() => {
    if (!enabled) return;

    const fetchInitialStatus = async () => {
      try {
        const data = await getStatus();
        // Update store with initial data if WebSocket isn't connected yet
        if (!wsConnected && data) {
          usePrinterStore.getState().setData({
            state: data.state || 'ready',
            progress: data.progress || 0,
            nozzleTemp: data.nozzleTemp || 0,
            bedTemp: data.bedTemp || 0,
            connected: data.connected !== false,
          });
        }
        setError(null);
      } catch (err) {
        setError("Failed to fetch printer status");
        console.error("[v0] Initial status fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialStatus();
  }, [enabled, wsConnected]);

  // Convert store state to PrinterStatus format for compatibility
  const status: PrinterStatus | null = {
    state: printerState,
    progress,
    nozzleTemp,
    bedTemp,
    connected,
    timestamp: Date.now(),
  };

  return {
    status,
    isLoading: isLoading && !wsConnected, // Only show loading if WebSocket isn't connected
    error,
    refetch: async () => {
      const data = await getStatus();
      if (data) {
        usePrinterStore.getState().setData({
          state: data.state || 'ready',
          progress: data.progress || 0,
          nozzleTemp: data.nozzleTemp || 0,
          bedTemp: data.bedTemp || 0,
          connected: data.connected !== false,
        });
      }
    },
  };
}
