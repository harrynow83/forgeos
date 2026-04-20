import { NextResponse } from "next/server";

const BASE = "http://localhost:3001";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${BASE}/api/print/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return NextResponse.json(await res.json());
}
