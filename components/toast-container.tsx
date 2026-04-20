"use client";

import { useToastStore } from "./toast-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => remove(t.id), 3000)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-black text-white px-4 py-2 rounded-xl shadow-lg"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}