import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("http://localhost:3001/api/printers/scan");
  return NextResponse.json(await res.json());
}
