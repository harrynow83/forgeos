"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface Printer {
  id: string;
  name: string;
  host: string;
  status: "idle" | "printing" | "paused" | "error" | "offline";
  progress: number;
  hotendTemp: number;
  hotendTarget: number;
  bedTemp: number;
  bedTarget: number;
  chamberTemp: number;
  chamberTarget: number;
  currentFile: string | null;
  timeRemaining: number; // seconds
  timeElapsed: number; // seconds
  layer: number;
  totalLayers: number;
}

export interface PrinterFile {
  id: string;
  name: string;
  size: number;
  modified: Date;
  estimatedTime: number; // seconds
  thumbnail?: string;
}

interface PrinterContextType {
  printers: Printer[];
  activePrinter: Printer | null;
  setActivePrinter: (id: string) => void;
  addPrinter: (name: string, url: string) => void;
  removePrinter: (id: string) => void;
  files: PrinterFile[];
  isSetupComplete: boolean;
  completeSetup: () => void;
  pausePrint: () => void;
  resumePrint: () => void;
  cancelPrint: () => void;
  startPrint: (fileId: string) => void;
  setTemperature: (type: "hotend" | "bed" | "chamber", value: number) => void;
  moveAxis: (axis: "x" | "y" | "z", distance: number) => void;
  homeAxis: (axis: "x" | "y" | "z" | "all") => void;
  extrude: (amount: number) => void;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

const mockFiles: PrinterFile[] = [
  { id: "1", name: "benchy_3DBenchy.gcode", size: 2345678, modified: new Date("2026-04-15"), estimatedTime: 5400 },
  { id: "2", name: "phone_stand_v2.gcode", size: 1234567, modified: new Date("2026-04-14"), estimatedTime: 7200 },
  { id: "3", name: "cable_clip_x20.gcode", size: 456789, modified: new Date("2026-04-13"), estimatedTime: 3600 },
  { id: "4", name: "raspberry_pi_case.gcode", size: 3456789, modified: new Date("2026-04-12"), estimatedTime: 10800 },
  { id: "5", name: "gear_set_planetary.gcode", size: 5678901, modified: new Date("2026-04-11"), estimatedTime: 14400 },
];

const defaultPrinter: Printer = {
  id: "local",
  name: "ForgeOS Printer",
  host: "http://localhost:3001",
  status: "printing",
  progress: 67,
  hotendTemp: 205,
  hotendTarget: 210,
  bedTemp: 58,
  bedTarget: 60,
  chamberTemp: 35,
  chamberTarget: 40,
  currentFile: "benchy_3DBenchy.gcode",
  timeRemaining: 1847,
  timeElapsed: 3753,
  layer: 134,
  totalLayers: 200,
};

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [printers, setPrinters] = useState<Printer[]>([defaultPrinter]);
  const [activePrinterId, setActivePrinterId] = useState<string>("local");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [files] = useState<PrinterFile[]>(mockFiles);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("forgeos-printers");
    const setupComplete = localStorage.getItem("forgeos-setup-complete");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setPrinters(parsed);
          setActivePrinterId(parsed[0].id);
        }
      } catch {
        // ignore
      }
    }
    if (setupComplete === "true") {
      setIsSetupComplete(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("forgeos-printers", JSON.stringify(printers));
  }, [printers]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrinters((prev) =>
        prev.map((p) => {
          if (p.status !== "printing") return p;
          const newProgress = Math.min(p.progress + 0.1, 100);
          const newLayer = Math.min(p.layer + (Math.random() > 0.9 ? 1 : 0), p.totalLayers);
          const newTimeElapsed = p.timeElapsed + 1;
          const newTimeRemaining = Math.max(p.timeRemaining - 1, 0);
          return {
            ...p,
            progress: newProgress,
            layer: newLayer,
            timeElapsed: newTimeElapsed,
            timeRemaining: newTimeRemaining,
            hotendTemp: p.hotendTarget + (Math.random() - 0.5) * 2,
            bedTemp: p.bedTarget + (Math.random() - 0.5) * 1,
            chamberTemp: p.chamberTarget + (Math.random() - 0.5) * 0.5,
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activePrinter = printers.find((p) => p.id === activePrinterId) || null;

  const setActivePrinter = useCallback((id: string) => {
    setActivePrinterId(id);
  }, []);

  const addPrinter = useCallback((name: string, url: string) => {
    const newPrinter: Printer = {
      id: crypto.randomUUID(),
      name,
      url,
      status: "idle",
      progress: 0,
      hotendTemp: 25,
      hotendTarget: 0,
      bedTemp: 25,
      bedTarget: 0,
      chamberTemp: 25,
      chamberTarget: 0,
      currentFile: null,
      timeRemaining: 0,
      timeElapsed: 0,
      layer: 0,
      totalLayers: 0,
    };
    setPrinters((prev) => [...prev, newPrinter]);
  }, []);

  const removePrinter = useCallback((id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const completeSetup = useCallback(() => {
    setIsSetupComplete(true);
    localStorage.setItem("forgeos-setup-complete", "true");
  }, []);

  const pausePrint = useCallback(() => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === activePrinterId ? { ...p, status: "paused" as const } : p))
    );
  }, [activePrinterId]);

  const resumePrint = useCallback(() => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === activePrinterId ? { ...p, status: "printing" as const } : p))
    );
  }, [activePrinterId]);

  const cancelPrint = useCallback(() => {
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === activePrinterId
          ? { ...p, status: "idle" as const, progress: 0, currentFile: null, layer: 0 }
          : p
      )
    );
  }, [activePrinterId]);

  const startPrint = useCallback((fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === activePrinterId
          ? {
              ...p,
              status: "printing" as const,
              progress: 0,
              currentFile: file.name,
              timeRemaining: file.estimatedTime,
              timeElapsed: 0,
              layer: 0,
              totalLayers: Math.floor(file.estimatedTime / 30),
              hotendTarget: 210,
              bedTarget: 60,
            }
          : p
      )
    );
  }, [activePrinterId, files]);

  const setTemperature = useCallback((type: "hotend" | "bed" | "chamber", value: number) => {
    setPrinters((prev) =>
      prev.map((p) => {
        if (p.id !== activePrinterId) return p;
        if (type === "hotend") return { ...p, hotendTarget: value };
        if (type === "bed") return { ...p, bedTarget: value };
        return { ...p, chamberTarget: value };
      })
    );
  }, [activePrinterId]);

  const moveAxis = useCallback((_axis: "x" | "y" | "z", _distance: number) => {
    // In real implementation, this would send G-code to Moonraker
    const activePrinter = printers.find(p => p.id === activePrinterId);
    if (activePrinter) {
      console.log(`Moving ${_axis} by ${_distance}mm to ${activePrinter.host}`);
    }
  }, [activePrinterId, printers]);

  const homeAxis = useCallback((_axis: "x" | "y" | "z" | "all") => {
    const activePrinter = printers.find(p => p.id === activePrinterId);
    if (activePrinter) {
      console.log(`Homing ${_axis} to ${activePrinter.host}`);
    }
  }, [activePrinterId, printers]);

  const extrude = useCallback((_amount: number) => {
    const activePrinter = printers.find(p => p.id === activePrinterId);
    if (activePrinter) {
      console.log(`Extruding ${_amount}mm to ${activePrinter.host}`);
    }
  }, [activePrinterId, printers]);

  return (
    <PrinterContext.Provider
      value={{
        printers,
        activePrinter,
        setActivePrinter,
        addPrinter,
        removePrinter,
        files,
        isSetupComplete,
        completeSetup,
        pausePrint,
        resumePrint,
        cancelPrint,
        startPrint,
        setTemperature,
        moveAxis,
        homeAxis,
        extrude,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
}
