"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrinter } from "@/lib/printer-context";

export function AlertBanner() {
  const { pausePrint, activePrinter } = usePrinter();
  const [alerts, setAlerts] = useState<{ id: string; message: string; type: "warning" | "error" }[]>([
    // Demo alert - in production this would come from AI detection
    // { id: "1", message: "Potential spaghetti detected on layer 45", type: "warning" },
  ]);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePauseAndDismiss = (id: string) => {
    pausePrint();
    dismissAlert(id);
  };

  if (alerts.length === 0 || activePrinter?.status !== "printing") return null;

  return (
    <div className="px-4 py-2">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className={`mb-2 overflow-hidden rounded-2xl ${
              alert.type === "error" ? "bg-destructive/20" : "bg-accent/20"
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  alert.type === "error" ? "bg-destructive" : "bg-accent"
                }`}
              >
                <AlertTriangle className="h-5 w-5 text-background" />
              </div>
              <p className="flex-1 text-sm font-medium text-foreground">{alert.message}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => handlePauseAndDismiss(alert.id)}
                >
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
