"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home,
  ChevronUp,
  ChevronDown,
  Thermometer,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { usePrinter } from "@/lib/printer-context";
import { cn } from "@/lib/utils";
import { api } from "@/components/api";
import { useLoading } from "@/components/useLoading";
import { useToastStore } from "@/components/toast-store";

const STEP_SIZES = [0.1, 1, 10, 50];

export default function ControlPage() {
  const { activePrinter, moveAxis, homeAxis, extrude, setTemperature } = usePrinter();
  const [stepSize, setStepSize] = useState(10);
  const [extrudeAmount, setExtrudeAmount] = useState(10);
  const { loading, setLoading } = useLoading();
  const { add } = useToastStore();

  const handlePause = async () => {
    try {
      setLoading(true);
      const res = await api("/api/printer/pause", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        add("Paused successfully");
      } else {
        add("Failed to pause");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setLoading(true);
      const res = await api("/api/printer/resume", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        add("Resumed successfully");
      } else {
        add("Failed to resume");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      const res = await api("/api/printer/cancel", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        add("Cancelled successfully");
      } else {
        add("Failed to cancel");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleHome = async (axis?: string) => {
    try {
      setLoading(true);
      let res;
      
      if (axis) {
        res = await api("/api/printer/gcode", {
          method: "POST",
          body: JSON.stringify({ cmd: `G28 ${axis}` })
        });
      } else {
        res = await api("/api/printer/home", { method: "POST" });
      }
      
      const data = await res.json();
      if (data.success) {
        add("Homed successfully");
      } else {
        add("Failed to home");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (axis: string, value: number) => {
    try {
      setLoading(true);
      const res = await api("/api/printer/move", {
        method: "POST",
        body: JSON.stringify({ axis, value })
      });
      const data = await res.json();

      if (data.success) {
        add("Moved successfully");
      } else {
        add("Failed to move");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetTemp = async (type: "nozzle" | "bed", temp: number) => {
    try {
      setLoading(true);
      const res = await api(`/api/printer/${type}`, {
        method: "POST",
        body: JSON.stringify({ temp })
      });
      const data = await res.json();

      if (data.success) {
        add(`${type === "nozzle" ? "Nozzle" : "Bed"} temperature set to ${temp}°`);
      } else {
        add("Failed to set temperature");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      setLoading(true);
      const res = await api("/api/printer/emergency", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        add("Emergency stop activated");
      } else {
        add("Failed to emergency stop");
      }
    } catch {
      add("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!activePrinter) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-foreground">No Printer Connected</h2>
          <p className="text-muted-foreground">Add a printer to access controls</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Step Size Selector */}
      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Step Size (mm)</p>
          <div className="flex gap-2">
            {STEP_SIZES.map((size) => (
              <motion.button
                key={size}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStepSize(size)}
                className={cn(
                  "flex-1 rounded-xl py-3 text-sm font-semibold transition-colors",
                  stepSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {size}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Axis Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* XY Control */}
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-center text-sm font-medium text-muted-foreground">
              X/Y Axis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-2">
              <div />
              <ControlButton
                icon={ArrowUp}
                onClick={() => handleMove("Y", stepSize)}
                label="Y+"
              />
              <div />
              <ControlButton
                icon={ArrowLeft}
                onClick={() => handleMove("X", -stepSize)}
                label="X-"
              />
              <ControlButton
                icon={Home}
                onClick={() => handleHome()}
                label="Home"
                variant="secondary"
              />
              <ControlButton
                icon={ArrowRight}
                onClick={() => handleMove("X", stepSize)}
                label="X+"
              />
              <div />
              <ControlButton
                icon={ArrowDown}
                onClick={() => handleMove("Y", -stepSize)}
                label="Y-"
              />
              <div />
            </div>
          </CardContent>
        </Card>

        {/* Z Control */}
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-center text-sm font-medium text-muted-foreground">
              Z Axis
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2 p-4 pt-0">
            <ControlButton
              icon={ChevronUp}
              onClick={() => handleMove("Z", stepSize)}
              label="Z+"
              className="w-20"
            />
            <ControlButton
              icon={Home}
              onClick={() => handleHome("Z")}
              label="Home Z"
              variant="secondary"
              className="w-20"
            />
            <ControlButton
              icon={ChevronDown}
              onClick={() => handleMove("Z", -stepSize)}
              label="Z-"
              className="w-20"
            />
          </CardContent>
        </Card>
      </div>

      {/* Extruder Controls */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Extruder
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount: {extrudeAmount}mm</span>
          </div>
          <Slider
            value={[extrudeAmount]}
            onValueChange={([value]) => setExtrudeAmount(value)}
            min={1}
            max={100}
            step={1}
            className="mb-4"
          />
          <div className="flex gap-3">
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={() => extrude(-extrudeAmount)}
                variant="outline"
                disabled={loading}
                className={cn("h-14 w-full rounded-2xl text-base", loading && "opacity-50")}
              >
                {loading ? "..." : <><Minus className="mr-2 h-5 w-5" />Retract</>}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={() => extrude(extrudeAmount)}
                disabled={loading}
                className={cn("h-14 w-full rounded-2xl bg-primary text-primary-foreground text-base", loading && "opacity-50")}
              >
                {loading ? "..." : <><Plus className="mr-2 h-5 w-5" />Extrude</>}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Controls */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            Temperature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-4 pt-0">
          <TemperatureSlider
            label="Nozzle"
            current={activePrinter.hotendTemp}
            target={activePrinter.hotendTarget}
            max={300}
            color="text-destructive"
            onChange={(value) => handleSetTemp("nozzle", value)}
          />
          <TemperatureSlider
            label="Bed"
            current={activePrinter.bedTemp}
            target={activePrinter.bedTarget}
            max={120}
            color="text-accent"
            onChange={(value) => handleSetTemp("bed", value)}
          />
          <TemperatureSlider
            label="Chamber"
            current={activePrinter.chamberTemp}
            target={activePrinter.chamberTarget}
            max={80}
            color="text-chart-5"
            onChange={(value) => handleSetTemp("nozzle", value)}
          />
        </CardContent>
      </Card>

      {/* Quick Temperature Presets */}
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Presets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-2">
            <PresetButton
              label="PLA"
              onClick={() => {
                handleSetTemp("nozzle", 210);
                handleSetTemp("bed", 60);
              }}
            />
            <PresetButton
              label="PETG"
              onClick={() => {
                handleSetTemp("nozzle", 240);
                handleSetTemp("bed", 80);
              }}
            />
            <PresetButton
              label="ABS"
              onClick={() => {
                handleSetTemp("nozzle", 250);
                handleSetTemp("bed", 100);
              }}
            />
            <PresetButton
              label="TPU"
              onClick={() => {
                handleSetTemp("nozzle", 230);
                handleSetTemp("bed", 50);
              }}
            />
            <PresetButton
              label="Cooldown"
              onClick={() => {
                handleSetTemp("nozzle", 0);
                handleSetTemp("bed", 0);
              }}
              variant="outline"
            />
            <PresetButton
              label="Preheat"
              onClick={() => {
                handleSetTemp("nozzle", 200);
                handleSetTemp("bed", 60);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Stop */}
      <Card className="rounded-3xl border-2 border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <motion.div whileTap={{ scale: 0.95 }} className="w-full">
            <Button
              onClick={handleEmergencyStop}
              disabled={loading}
              variant="destructive"
              className={cn("h-14 w-full rounded-2xl text-base font-semibold", loading && "opacity-50")}
            >
              {loading ? "..." : <><AlertTriangle className="mr-2 h-5 w-5" />EMERGENCY STOP</>}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  label: string;
  variant?: "default" | "secondary";
  className?: string;
}

function ControlButton({
  icon: Icon,
  onClick,
  label,
  variant = "default",
  className,
}: ControlButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex h-16 flex-col items-center justify-center rounded-2xl transition-colors",
        variant === "default"
          ? "bg-secondary hover:bg-secondary/80"
          : "bg-primary/10 text-primary hover:bg-primary/20",
        className
      )}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
}

interface TemperatureSliderProps {
  label: string;
  current: number;
  target: number;
  max: number;
  color: string;
  onChange: (value: number) => void;
}

function TemperatureSlider({
  label,
  current,
  target,
  max,
  color,
  onChange,
}: TemperatureSliderProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold", color)}>{Math.round(current)}°C</span>
          <span className="text-xs text-muted-foreground">/ {target}°C</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Slider
          value={[target]}
          onValueChange={([value]) => onChange(value)}
          min={0}
          max={max}
          step={5}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-12 rounded-lg text-xs"
          onClick={() => onChange(0)}
        >
          Off
        </Button>
      </div>
    </div>
  );
}

interface PresetButtonProps {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
}

function PresetButton({ label, onClick, variant = "default" }: PresetButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl text-sm font-medium transition-colors",
        variant === "default"
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "border border-border bg-transparent text-foreground hover:bg-secondary"
      )}
    >
      {label}
    </motion.button>
  );
}
