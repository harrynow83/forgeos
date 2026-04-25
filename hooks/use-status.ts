"use client";
import { useEffect, useState } from "react";
import { save, load } from "./usePersistentState";
import { usePrinterStore } from "@/store/printerStore";

export default function useStatus() {
  const [data, setData] = useState<any>({});

  // Get real-time data from Zustand store (updated via WebSocket)
  const printerState = usePrinterStore((state) => state.state);
  const progress = usePrinterStore((state) => state.progress);
  const nozzleTemp = usePrinterStore((state) => state.nozzleTemp);
  const bedTemp = usePrinterStore((state) => state.bedTemp);
  const connected = usePrinterStore((state) => state.connected);
  const activePrinter = usePrinterStore((state) => state.activePrinter);
  const wsConnected = usePrinterStore((state) => state.wsConnected);

  useEffect(() => {
    // Convert store state to status format for compatibility
    const statusData = {
      state: printerState,
      progress,
      nozzleTemp,
      bedTemp,
      connected,
      printer: activePrinter,
      timestamp: Date.now(),
    };

    // Cache and set data
    save("printer_status", statusData);
    setData(statusData);
  }, [printerState, progress, nozzleTemp, bedTemp, connected, activePrinter]);

  // Initial load and fallback for when WebSocket isn't connected
  useEffect(() => {
    if (wsConnected) return; // Don't fetch if WebSocket is connected

    // Try to load cached status first
    const cached = load("printer_status");
    if (cached) {
      setData(cached);
    }

    const loadStatus = () => {
      fetch("/api/printer/status")
        .then(r => r.json())
        .then(newData => {
          // Cache the status
          save("printer_status", newData);
          setData(newData);
        })
        .catch(err => {
          console.error("Failed to load status:", err);
          // Fallback to cached status
          const cached = load("printer_status");
          if (cached) {
            setData(cached);
          }
        });
    };

    loadStatus();
    
    // Only poll if WebSocket isn't connected
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [wsConnected]);

  return data;
}
