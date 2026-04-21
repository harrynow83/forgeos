"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Printer, Plus, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrinter } from "@/store/printerStore";
import { cn } from "@/lib/utils";

export function PrinterSelector() {
  const { printers, activePrinter, setActivePrinter } = usePrinter();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "printing":
        return "bg-primary";
      case "paused":
        return "bg-accent";
      case "error":
        return "bg-destructive";
      case "idle":
        return "bg-success";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 items-center gap-2 rounded-xl border-border bg-secondary px-3"
      >
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", getStatusColor(activePrinter?.status || "offline"))} />
          <span className="max-w-24 truncate text-sm font-medium">
            {activePrinter?.name || "No Printer"}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            >
              <div className="p-2">
                {printers.map((printer) => (
                  <motion.button
                    key={printer.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActivePrinter(printer);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                      activePrinter?.id === printer.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        activePrinter?.id === printer.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                      )}
                    >
                      <Printer className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{printer.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {printer.status === "offline" ? (
                          <WifiOff className="h-3 w-3" />
                        ) : (
                          <Wifi className="h-3 w-3" />
                        )}
                        <span className="capitalize">{printer.status}</span>
                        {printer.status === "printing" && (
                          <span className="text-primary">({Math.round(printer.progress || 0)}%)</span>
                        )}
                      </div>
                    </div>
                    <div className={cn("h-2 w-2 rounded-full", getStatusColor(printer.status))} />
                  </motion.button>
                ))}
              </div>
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to settings or open add printer modal
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Printer
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
