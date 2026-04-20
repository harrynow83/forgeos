"use client";

import { useEffect, useState, useCallback } from "react";
import { getStatus, PrinterStatus } from "@/lib/api";

interface UsePrinterStatusOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

export function usePrinterStatus(options: UsePrinterStatusOptions = {}) {
  const { pollingInterval = 2000, enabled = true } = options;
  
  const [status, setStatus] = useState<PrinterStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      if (data) {
        setStatus(data);
        setError(null);
      }
    } catch (err) {
      setError("Failed to fetch printer status");
      console.error("[v0] Polling error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchStatus();

    // Set up polling
    const intervalId = setInterval(fetchStatus, pollingInterval);

    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval, fetchStatus]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
