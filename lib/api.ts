const BASE_URL = "http://localhost:3001";

export interface WifiNetwork {
  ssid: string;
  signal: number;
  secure: boolean;
  connected?: boolean;
}

export interface WifiStatus {
  ssid: string | null;
  signal: number;
}

export interface PrinterStatus {
  state: "idle" | "printing" | "paused" | "error";
  progress: number;
  currentFile: string | null;
  layer: number;
  totalLayers: number;
  timeRemaining: number;
  timeElapsed: number;
  temperatures: {
    hotend: { current: number; target: number };
    bed: { current: number; target: number };
    chamber: { current: number; target: number };
  };
}

export interface PrinterStatusSimple {
  state: "printing" | "paused" | "idle" | "error";
  progress: number;
  nozzle: number;
  bed: number;
  chamber?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// WiFi APIs
export async function getWifiNetworks(): Promise<WifiNetwork[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/wifi`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data.networks || [];
  } catch (error) {
    console.error("[v0] Failed to fetch WiFi networks:", error);
    return [];
  }
}

// Get current WiFi connection
export async function getCurrentWifi(): Promise<WifiStatus> {
  try {
    const response = await fetch(`/api/wifi/current`, {
      method: "GET",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[v0] Failed to get current WiFi:", error);
    return { ssid: null, signal: 0 };
  }
}

// Get printer status
export async function getPrinterStatus(): Promise<PrinterStatusSimple> {
  try {
    const response = await fetch(`/api/printer/status`, {
      method: "GET",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[v0] Failed to get printer status:", error);
    return { state: "idle", progress: 0, nozzle: 0, bed: 0, chamber: 0 };
  }
}

// Connect to WiFi using Next.js proxy
export async function connectWifi(ssid: string, password: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/wifi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid, password }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[v0] Failed to connect to WiFi:", error);
    return { success: false, error: "Connection failed" };
  }
}

// Print Control APIs
export async function pausePrint(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to pause print:", error);
    return { success: false, error: "Failed to pause print" };
  }
}

export async function cancelPrint(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to cancel print:", error);
    return { success: false, error: "Failed to cancel print" };
  }
}

export async function resumePrint(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resume" }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to resume print:", error);
    return { success: false, error: "Failed to resume print" };
  }
}

// Status API
export async function getStatus(): Promise<PrinterStatus | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data.status || null;
  } catch (error) {
    console.error("[v0] Failed to fetch status:", error);
    return null;
  }
}

// Movement APIs
export async function moveAxis(axis: "x" | "y" | "z", distance: number): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ axis, distance }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to move axis:", error);
    return { success: false, error: "Failed to move axis" };
  }
}

export async function homeAxis(axis: "x" | "y" | "z" | "all"): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/home`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ axis }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to home axis:", error);
    return { success: false, error: "Failed to home axis" };
  }
}

export async function extrude(amount: number): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/extrude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to extrude:", error);
    return { success: false, error: "Failed to extrude" };
  }
}

export async function setTemperature(
  heater: "hotend" | "bed" | "chamber",
  target: number
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/temperature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heater, target }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to set temperature:", error);
    return { success: false, error: "Failed to set temperature" };
  }
}

// Files API
export async function getFiles(): Promise<{ files: Array<{ name: string; size: number; modified: string }> }> {
  try {
    const response = await fetch(`${BASE_URL}/api/files`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to fetch files:", error);
    return { files: [] };
  }
}

export async function startPrint(filename: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to start print:", error);
    return { success: false, error: "Failed to start print" };
  }
}

export async function deleteFile(filename: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    return await response.json();
  } catch (error) {
    console.error("[v0] Failed to delete file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}

// ============================================
// First Boot Setup APIs (Backend on localhost:3001)
// ============================================

export interface SystemStatus {
  setup: boolean;
  connected?: boolean;
  ip?: string;
}

// Scan for available WiFi networks using Next.js proxy
export async function scanWifiNetworks(): Promise<WifiNetwork[]> {
  try {
    const response = await fetch(`/api/wifi`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.success && data.networks) {
      return data.networks;
    }
    return data.networks || [];
  } catch (error) {
    console.error("[v0] Failed to scan WiFi networks:", error);
    return [];
  }
}

// Mark setup as complete
export async function markSetupDone(): Promise<ApiResponse> {
  try {
    const response = await fetch("/api/setup_done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    // Save setup state to localStorage
    localStorage.setItem("setup_done", "true");
    
    return data;
  } catch (error) {
    console.error("[v0] Failed to mark setup done:", error);
    return { success: false, error: "Failed to complete setup" };
  }
}

// Get system status including setup state
export async function getSystemStatus(): Promise<SystemStatus | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[v0] Failed to get system status:", error);
    return null;
  }
}

// Get QR code for mobile connection
export async function getQRCode(): Promise<string | null> {
  try {
    const response = await fetch(`/api/qr`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.qr || data.url || null;
  } catch (error) {
    console.error("[v0] Failed to get QR code:", error);
    return null;
  }
}

// ============================================
// OTA UPDATE SYSTEM
// ============================================

export interface UpdateStatus {
  updating: boolean;
  progress: number;
  message: string;
}

// Initiate system update
export async function updateSystem(): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    
    if (!response.ok && !data.success) {
      return data;
    }
    return data;
  } catch (error) {
    console.error("[v0] Failed to initiate system update:", error);
    return { success: false, error: "Update request failed" };
  }
}

// Get update status
export async function getUpdateStatus(): Promise<UpdateStatus> {
  try {
    const response = await fetch(`/api/update`, {
      method: "GET",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[v0] Failed to get update status:", error);
    return { updating: false, progress: 0, message: "Failed to get status" };
  }
}
