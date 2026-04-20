import { NextResponse } from "next/server";

export async function POST() {
  // In production: Send pause command to Moonraker
  // const moonrakerUrl = process.env.MOONRAKER_URL || 'http://localhost:7125';
  // await fetch(`${moonrakerUrl}/printer/print/pause`, { method: 'POST' });

  return NextResponse.json({
    success: true,
    message: "Print paused",
    timestamp: new Date().toISOString(),
  });
}
