import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:3001";

export async function POST() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Update request failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/update/status`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        updating: false,
        progress: 0,
        message: "Failed to get update status",
      },
      { status: 500 }
    );
  }
}
