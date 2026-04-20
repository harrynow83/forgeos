import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/printer/status`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      state: "idle",
      progress: 0,
      nozzle: 0,
      bed: 0,
      chamber: 0,
    });
  }
}
