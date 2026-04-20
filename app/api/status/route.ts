import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Try to get status from backend first
    try {
      const backendResponse = await fetch("http://localhost:3001/api/status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        return NextResponse.json(backendData);
      }
    } catch (backendError) {
      console.warn("Backend not available, checking local setup status");
    }

    // Fallback: Check if setup is complete by looking for setup_done file
    const setupFile = path.join(process.cwd(), "setup_done");
    const setupComplete = fs.existsSync(setupFile);
    
    return NextResponse.json({
      setup: setupComplete,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to check setup status:", error);
    // Default to setup not complete on error
    return NextResponse.json({
      setup: false,
      timestamp: new Date().toISOString(),
    });
  }
}
