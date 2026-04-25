"use client";

import { useEffect, useState } from "react";
import { usePrinterStore } from "@/store/printerStore";

export function useBackend() {
  const [connected, setConnected] = useState(true);
  const wsConnected = usePrinterStore((state) => state.wsConnected);

  useEffect(() => {
    // Use WebSocket connection state as backend connectivity indicator
    setConnected(wsConnected);
  }, [wsConnected]);

  // Fallback check if WebSocket isn't connected yet
  useEffect(() => {
    if (wsConnected) return; // Don't poll if WebSocket is connected

    const check = () => {
      fetch("/api/status")
        .then(() => setConnected(true))
        .catch(() => setConnected(false));
    };

    check();

    const interval = setInterval(check, 10000); // Reduced frequency for fallback

    return () => clearInterval(interval);
  }, [wsConnected]);

  return connected;
}
