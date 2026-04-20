"use client";
import { useEffect, useState } from "react";
import { save, load } from "./usePersistentState";

export default function useStatus() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const loadStatus = () => {
      fetch("/api/printer/status")
        .then(r => r.json())
        .then(newData => {
          // Cache the status
          save("printer_status", newData);
          setData(newData);
        })
        .catch(err => {
          console.error("Failed to load status:", err);
          // Fallback to cached status
          const cached = load("printer_status");
          if (cached) {
            setData(cached);
          }
        });
    };

    // Try to load cached status first
    const cached = load("printer_status");
    if (cached) {
      setData(cached);
    }

    loadStatus();
    const i = setInterval(loadStatus, 2000);
    return () => clearInterval(i);
  }, []);

  return data;
}
