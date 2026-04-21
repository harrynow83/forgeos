"use client";

import { create } from "zustand";

export const usePrinter = create((set) => ({
  state: "offline",
  progress: 0,
  nozzle: 0,
  bed: 0,
  setData: (data: any) => set(data),
}));