"use client";

import { create } from "zustand";

interface Printer {
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
}

interface PrinterFile {
  id: string;
  name: string;
  size: number;
  modified: string;
  estimatedTime?: number;
}

interface PrinterStore {
  state: "idle" | "printing" | "paused" | "offline" | "ready" | "error";
  progress: number;
  nozzleTemp: number;
  bedTemp: number;
  connected: boolean;
  loading: boolean;
  wsConnected: boolean;
  isOnline: boolean;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  lastSyncTime: number | null;
  printers: Printer[];
  activePrinter: Printer;
  files: PrinterFile[];
  pausePrint: () => Promise<void>;
  resumePrint: () => Promise<void>;
  cancelPrint: () => Promise<void>;
  startPrint: (filename: string) => Promise<void>;
  completeSetup: () => Promise<void>;
  setActivePrinter: (printer: Printer) => void;
  addPrinter: (printer: Omit<Printer, "id">) => void;
  removePrinter: (id: string) => void;
  setData: (data: Partial<PrinterStore>) => void;
  setWsConnected: (connected: boolean) => void;
  setIsOnline: (online: boolean) => void;
  setConnectionStatus: (status: "connected" | "disconnected" | "reconnecting") => void;
  updateLastSyncTime: () => void;
}

export const usePrinterStore = create<PrinterStore>((set, get) => ({
  state: "ready",
  progress: 0,
  nozzleTemp: 0,
  bedTemp: 0,
  connected: false,
  loading: false,
  wsConnected: false,
  isOnline: true,
  connectionStatus: "disconnected",
  lastSyncTime: null,
  printers: [] as Printer[],
  activePrinter: {
    id: "",
    name: "",
    host: "",
    status: "idle" as const,
  },
  files: [] as PrinterFile[],

  pausePrint: async () => {
    if (typeof window !== 'undefined') {
      await fetch("/api/printer/pause", { method: "POST" });
    }
  },

  resumePrint: async () => {
    if (typeof window !== 'undefined') {
      await fetch("/api/printer/resume", { method: "POST" });
    }
  },

  cancelPrint: async () => {
    if (typeof window !== 'undefined') {
      await fetch("/api/printer/cancel", { method: "POST" });
    }
  },

  startPrint: async (filename: string) => {
    if (typeof window !== 'undefined') {
      await fetch("/api/printer/start", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
    }
  },

  completeSetup: async () => {
    if (typeof window !== 'undefined') {
      await fetch("/api/setup_done", { method: "POST" });
    }
  },

  setActivePrinter: (printer: Printer) => {
    if (typeof window !== 'undefined') {
      set({ activePrinter: printer });
    }
  },

  addPrinter: (printer: Omit<Printer, "id">) => {
    if (typeof window !== 'undefined') {
      const newPrinter = { ...printer, id: Date.now().toString() };
      set((state) => ({ printers: [...state.printers, newPrinter] }));
    }
  },

  removePrinter: (id: string) => {
    if (typeof window !== 'undefined') {
      set((state) => ({ printers: state.printers.filter((p) => p.id !== id) }));
    }
  },

  setData: (data) => {
    if (typeof window !== 'undefined') {
      set((state) => ({ ...state, ...data }));
    }
  },

  setWsConnected: (connected: boolean) => {
    if (typeof window !== 'undefined') {
      set({ wsConnected: connected });
    }
  },

  setIsOnline: (online: boolean) => {
    if (typeof window !== 'undefined') {
      set({ isOnline: online });
    }
  },

  setConnectionStatus: (status: "connected" | "disconnected" | "reconnecting") => {
    if (typeof window !== 'undefined') {
      set({ connectionStatus: status });
    }
  },

  updateLastSyncTime: () => {
    if (typeof window !== 'undefined') {
      set({ lastSyncTime: Date.now() });
    }
  },
}));