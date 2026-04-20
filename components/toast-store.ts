"use client";

import { create } from "zustand";

type Toast = {
  id: number;
  message: string;
};

type Store = {
  toasts: Toast[];
  add: (msg: string) => void;
  remove: (id: number) => void;
};

export const useToastStore = create<Store>((set) => ({
  toasts: [],

  add: (message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), message }]
    })),

  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }))
}));