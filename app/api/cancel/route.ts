import { NextResponse } from "next/server";

export async function POST() {
  // In production: Send cancel command to Moonraker
  // const moonrakerUrl = process.env.MOONRAKER_URL || 'http://localhost:7125';
  // await fetch(`${moonrakerUrl}/printer/print/cancel`, { method: 'POST' });

  return NextResponse.json({
    success: true,
    message: "Print cancelled",
    timestamp: new Date().toISOString(),
  });
}
