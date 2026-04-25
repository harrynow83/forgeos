"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "./bottom-nav";
import { PrinterSelector } from "./printer-selector";
import { AlertBanner } from "./alert-banner";
import { OfflineBanner } from "./OfflineBanner";
import TopBar from "./topbar";
import { usePrinterStore } from "@/store/printerStore";
import { useWebSocketSync } from "@/hooks/useWebSocketSync";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const completeSetup = usePrinterStore((state) => state.completeSetup);
  const isSetupPage = pathname.startsWith("/setup");
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Initialize WebSocket for real-time updates
  useWebSocketSync();

  // Simple setup detection using backend endpoint
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/status");
        const data = await response.json();
        
        if (!data.setup) {
          // Setup not complete, redirect to setup
          if (!isSetupPage) {
            router.replace("/setup/first-boot");
          }
        } else {
          // Setup complete, sync local state
          completeSetup();
        }
      } catch (error) {
        // Backend unavailable, fall back to local state
        console.warn("Backend unavailable for setup check:", error);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkSetup();
  }, [completeSetup, isSetupPage, router]);

  // Show setup pages directly
  if (isSetupPage) {
    return <>{children}</>;
  }

  // Show loading while checking setup status
  if (isCheckingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <OfflineBanner />
      <header className="border-b border-border bg-card/95 backdrop-blur-lg safe-area-pt">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ForgeOS</h1>
              <p className="text-xs text-muted-foreground">3D Print Control</p>
            </div>
          </div>
          <PrinterSelector />
        </div>
      </header>

      <AlertBanner />

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 pb-28"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
