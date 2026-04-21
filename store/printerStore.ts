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
}

export const usePrinter = create<PrinterStore>((set, get) => ({
  state: "ready",
  progress: 0,
  nozzleTemp: 0,
  bedTemp: 0,
  connected: false,
  loading: false,
  printers: [] as Printer[],
  activePrinter: {
    id: "",
    name: "",
    host: "",
    status: "idle" as const,
  },
  files: [] as PrinterFile[],

  pausePrint: async () => {
    await fetch("/api/printer/pause", { method: "POST" });
  },

  resumePrint: async () => {
    await fetch("/api/printer/resume", { method: "POST" });
  },

  cancelPrint: async () => {
    await fetch("/api/printer/cancel", { method: "POST" });
  },

  startPrint: async (filename: string) => {
    await fetch("/api/printer/start", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    });
  },

  completeSetup: async () => {
    await fetch("/api/setup_done", { method: "POST" });
  },

  setActivePrinter: (printer: Printer) => {
    set({ activePrinter: printer });
  },

  addPrinter: (printer: Omit<Printer, "id">) => {
    const newPrinter = { ...printer, id: Date.now().toString() };
    set((state) => ({ printers: [...state.printers, newPrinter] }));
  },

  removePrinter: (id: string) => {
    set((state) => ({ printers: state.printers.filter((p) => p.id !== id) }));
  },

  setData: (data) => set((state) => ({ ...state, ...data })),
}));