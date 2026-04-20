import { NextResponse } from "next/server";

const BASE = "http://localhost:3001";

export async function GET() {
  const res = await fetch(`${BASE}/api/files`);
  return NextResponse.json(await res.json());
}
