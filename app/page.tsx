"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Thermometer, Clock, Layers, Camera, Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePrinter } from "@/store/printerStore";
import { cn } from "@/lib/utils";
import useStatus from "@/hooks/use-status";
import { useNetwork } from "@/hooks/useNetwork";
import { useBackend } from "@/hooks/useBackend";
import { save, load } from "@/hooks/usePersistentState";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${Math.floor(s)}s`;
  return `${Math.floor(s)}s`;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const activePrinter = usePrinterStore((s) => s.activePrinter)
  const pausePrint = usePrinterStore((s) => s.pausePrint)
  const resumePrint = usePrinterStore((s) => s.resumePrint)
  const cancelPrint = usePrinterStore((s) => s.cancelPrint)
  const status = useStatus();
  const online = useNetwork();
  const backend = useBackend();

  useEffect(() => {
    // 1️⃣ Check localStorage first
    const cached = load("setup_done");

    if (cached === true) {
      setLoading(false);
      return;
    }

    // 2️⃣ Fallback to API
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        console.log("STATUS:", data);

        if (data?.setup === true) {
          save("setup_done", true);
          setLoading(false);
        } else {
          window.location.href = "/setup";
        }
      })
      .catch(() => {
        // Fail-safe: allow app instead of blocking forever
        setLoading(false);
      });
  }, []);

  if (!online) {
    return <div>No Internet Connection</div>;
  }

  if (!backend) {
    return <div>Reconnecting to device...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Status indicators
  const statusIndicator = (
    <div className="fixed top-4 right-4 z-50 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-medium">
      {online ? "🌐 Online" : "❌ Offline"} | {backend ? "🟢 Device OK" : "🔄 Reconnecting"}
    </div>
  );

  if (!activePrinter) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">No Printer Connected</h2>
          <p className="text-muted-foreground">Add a printer from the dropdown above</p>
        </div>
      </div>
    );
  }

  const isPrinting = status.state === "printing";
  const isPaused = status.state === "paused";

  return (
    <div className="space-y-4 p-4">
      {statusIndicator}
      {/* Camera Feed */}
      <Card className="overflow-hidden rounded-3xl border-border bg-card">
        <div className="relative aspect-video bg-secondary">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Camera Feed</p>
              <p className="text-xs text-muted-foreground/60">Connect webcam for live view</p>
            </div>
          </div>
          {/* Status Badge */}
          <div className="absolute left-4 top-4">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                isPrinting && "bg-primary/20 text-primary",
                isPaused && "bg-accent/20 text-accent",
                status.state === "idle" && "bg-success/20 text-success",
                status.state === "error" && "bg-destructive/20 text-destructive"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isPrinting && "bg-primary animate-pulse",
                  isPaused && "bg-accent",
                  status.state === "idle" && "bg-success",
                  status.state === "error" && "bg-destructive"
                )}
              />
              <span className="capitalize">
                {status.state === "printing" && "🟢 Printing"}
                {status.state === "paused" && "🟡 Paused"}
                {status.state === "error" && "🔴 Error"}
                {status.state === "idle" && "⚪ Idle"}
                {!status.state && "🔴 Offline"}
              </span>
            </div>
          </div>
          {/* File Name Badge */}
          {activePrinter.currentFile && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="rounded-xl bg-background/80 px-3 py-2 backdrop-blur-sm">
                <p className="truncate text-sm font-medium text-foreground">
                  {activePrinter.currentFile}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Progress Bar */}
      {(isPrinting || isPaused) && (
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Print Progress</span>
              <span className="text-2xl font-bold text-primary">
                {Math.round(activePrinter.progress || 0)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${activePrinter.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Time Remaining */}
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Time Remaining</p>
            <p className="text-xl font-bold text-foreground">
              {isPrinting || isPaused && activePrinter.timeRemaining ? formatTime(activePrinter.timeRemaining) : "--:--"}
            </p>
          </CardContent>
        </Card>

        {/* Layer */}
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Layers className="h-5 w-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Layer</p>
            <p className="text-xl font-bold text-foreground">
              {isPrinting || isPaused
                ? `${activePrinter.layer} / ${activePrinter.totalLayers}`
                : "-- / --"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Cards */}
      <div className="grid grid-cols-2 gap-3">
        <TemperatureCard
          label="Hotend"
          current={status.nozzle || 0}
          target={status.nozzle || 0}
          color="text-destructive"
          bgColor="bg-destructive/10"
        />
        <TemperatureCard
          label="Bed"
          current={status.bed || 0}
          target={status.bed || 0}
          color="text-accent"
          bgColor="bg-accent/10"
        />
      </div>

      {/* Control Buttons */}
      {(isPrinting || isPaused) && (
        <div className="flex gap-3">
          {isPrinting ? (
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={pausePrint}
                className="h-16 w-full rounded-2xl bg-accent text-accent-foreground text-lg font-semibold"
              >
                <Pause className="mr-2 h-6 w-6" />
                Pause
              </Button>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={resumePrint}
                className="h-16 w-full rounded-2xl bg-primary text-primary-foreground text-lg font-semibold"
              >
                <Play className="mr-2 h-6 w-6" />
                Resume
              </Button>
            </motion.div>
          )}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={cancelPrint}
              variant="outline"
              className="h-16 w-16 rounded-2xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Square className="h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      )}

      {/* Idle State */}
      {status.state === "idle" && (
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
              <Play className="h-8 w-8 text-success" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Ready to Print</h3>
            <p className="text-sm text-muted-foreground">
              Go to Files to start a new print job
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TemperatureCardProps {
  label: string;
  current: number;
  target: number;
  color: string;
  bgColor: string;
}

function TemperatureCard({ label, current, target, color, bgColor }: TemperatureCardProps) {
  const isHeating = target > 0 && current < target - 2;
  const isAtTemp = target > 0 && Math.abs(current - target) <= 2;

  return (
    <Card className="rounded-3xl border-border bg-card">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bgColor)}>
            <Thermometer className={cn("h-5 w-5", color)} />
          </div>
          {isHeating && (
            <span className="text-xs text-accent animate-pulse">Heating...</span>
          )}
          {isAtTemp && (
            <span className="text-xs text-success">At Temp</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-xl font-bold", color)}>{Math.round(current)}°</span>
          {target > 0 && (
            <span className="text-sm text-muted-foreground">/ {target}°C</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
