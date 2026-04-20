"use client";

import { useEffect, useState } from "react";

export function useBackend() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const check = () => {
      fetch("/api/status")
        .then(() => setConnected(true))
        .catch(() => setConnected(false));
    };

    check();

    const interval = setInterval(check, 5000);

    return () => clearInterval(interval);
  }, []);

  return connected;
}
