"use client";

import { create } from "zustand";

export const usePrinter = create((set) => ({
  state: "idle",
  progress: 0,
  nozzle: 0,
  bed: 0,

  activePrinter: {
    status: "idle",
  },

  pausePrint: async () => {
    await fetch("/api/printer/pause", { method: "POST" });
  },

  setData: (data: any) => set(data),
}));