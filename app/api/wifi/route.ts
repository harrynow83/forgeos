import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wifi/scan`);
    const data = await res.json();

    return NextResponse.json({
      success: true,
      networks: data,
      currentConnection: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Backend not reachable" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/wifi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Connection failed" },
      { status: 500 }
    );
  }
}