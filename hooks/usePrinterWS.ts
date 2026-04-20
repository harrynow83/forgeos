"use client";

import { useEffect, useState } from "react";

export function usePrinterWS() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7125/websocket");

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.method === "notify_status_update") {
          setData(parsed.params?.[0] || {});
        }
      } catch (error) {
        console.error("WebSocket parse error:", error);
      }
    };

    ws.onopen = () => {
      console.debug("Printer WebSocket connected");
    };

    ws.onerror = (event) => {
      console.error("Printer WebSocket error:", event);
    };

    return () => ws.close();
  }, []);

  return data;
}
