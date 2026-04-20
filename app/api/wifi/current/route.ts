import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wifi/current`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      ssid: null,
      signal: 0,
    });
  }
}
