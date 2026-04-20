import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Call backend to mark setup as done
    const response = await fetch("http://localhost:3001/api/setup_done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { success: false, error: "Backend error" },
      { status: response.status }
    );
  } catch (error) {
    console.error("Failed to mark setup as done:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark setup complete" },
      { status: 500 }
    );
  }
}
