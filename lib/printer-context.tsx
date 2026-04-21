"use client";

import { createContext, useContext, ReactNode } from 'react';

interface PrinterContextType {
  state: "idle" | "printing" | "paused" | "offline" | "ready" | "error";
  progress: number;
  nozzleTemp: number;
  bedTemp: number;
  connected: boolean;
  loading: boolean;
  printers: Array<{
    id: string;
    name: string;
    host: string;
    status: "idle" | "printing" | "paused" | "offline";
    progress?: number;
    currentFile?: string;
    timeRemaining?: number;
    layer?: number;
    totalLayers?: number;
    url?: string;
  }>;
  activePrinter: {
    id: string;
    name: string;
    host: string;
    status: "idle" | "printing" | "paused" | "offline";
    progress?: number;
    currentFile?: string;
    timeRemaining?: number;
    layer?: number;
    totalLayers?: number;
    url?: string;
  };
  files: Array<{
    id: string;
    name: string;
    size: number;
    modified: string;
    estimatedTime?: number;
  }>;
  pausePrint: () => Promise<void>;
  resumePrint: () => Promise<void>;
  cancelPrint: () => Promise<void>;
  startPrint: (filename: string) => Promise<void>;
  completeSetup: () => Promise<void>;
  setActivePrinter: (printer: any) => void;
  addPrinter: (printer: any) => void;
  removePrinter: (id: string) => void;
  setData: (data: any) => void;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (!context) {
    // SSR-safe fallback - return default values during server-side rendering
    if (typeof window === 'undefined') {
      return {
        state: "ready",
        progress: 0,
        nozzleTemp: 0,
        bedTemp: 0,
        connected: false,
        loading: false,
        printers: [],
        activePrinter: {
          id: "",
          name: "",
          host: "",
          status: "idle",
        },
        files: [],
        pausePrint: async () => {},
        resumePrint: async () => {},
        cancelPrint: async () => {},
        startPrint: async () => {},
        completeSetup: async () => {},
        setActivePrinter: () => {},
        addPrinter: () => {},
        removePrinter: () => {},
        setData: () => {},
      };
    }
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
}

export function PrinterProvider({ children }: { children: ReactNode }) {
  return <PrinterContext.Provider value={null}>{children}</PrinterContext.Provider>;
}
