"use client";

import { useEffect, useState } from "react";
import { Wifi, Printer } from "lucide-react";
import { usePrinterStore } from "@/store/printerStore";

interface WifiStatus {
  ssid: string | null;
  signal: number;
}

interface PrinterStatus {
  state: "printing" | "paused" | "idle" | "error";
  progress: number;
  nozzle: number;
  bed: number;
  chamber?: number;
}

export default function TopBar() {
  const [wifi, setWifi] = useState<WifiStatus>({ ssid: null, signal: 0 });
  const [loading, setLoading] = useState(true);

  // Get real-time printer data from Zustand store (updated via WebSocket)
  const printerState = usePrinterStore((state) => state.state);
  const progress = usePrinterStore((state) => state.progress);
  const nozzleTemp = usePrinterStore((state) => state.nozzleTemp);
  const bedTemp = usePrinterStore((state) => state.bedTemp);
  const wsConnected = usePrinterStore((state) => state.wsConnected);

  // Create printer status object from store data
  const printer: PrinterStatus = {
    state: printerState as "printing" | "paused" | "idle" | "error",
    progress,
    nozzle: nozzleTemp,
    bed: bedTemp,
    chamber: 0,
  };

  useEffect(() => {
    const loadWifi = async () => {
      try {
        const wifiRes = await fetch("/api/wifi/current");
        const wifiData = await wifiRes.json();
        setWifi(wifiData);
      } catch (err) {
        console.error("Failed to load WiFi status:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWifi();
    
    // Only poll WiFi status (printer data comes from WebSocket)
    const interval = setInterval(loadWifi, 10000);
    return () => clearInterval(interval);
  }, []);

  const getWifiIcon = () => {
    if (!wifi.ssid) return "📶";
    if (wifi.signal > 70) return "📶";
    if (wifi.signal > 40) return "📶";
    return "📶";
  };

  const getPrinterIcon = () => {
    if (printer.state === "printing") return "🟢";
    if (printer.state === "paused") return "🟡";
    if (printer.state === "error") return "🔴";
    return "⚪";
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 text-xs bg-background/80 backdrop-blur border-b border-border sticky top-0 z-50">
      {/* WiFi Status */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span>{getWifiIcon()}</span>
        <span className="truncate text-muted-foreground">
          {wifi.ssid || "No WiFi"}
        </span>
      </div>

      {/* Printer State */}
      <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
        <span>{getPrinterIcon()}</span>
        <span className="truncate text-muted-foreground">
          {printer.state === "printing"
            ? `Printing ${printer.progress}%`
            : printer.state.charAt(0).toUpperCase() + printer.state.slice(1)}
        </span>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
        <span>🌡️</span>
        <span className="truncate text-muted-foreground">
          {printer.nozzle}°C / {printer.bed}°C
        </span>
      </div>
    </div>
  );
}
