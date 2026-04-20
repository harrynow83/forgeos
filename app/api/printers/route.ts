import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("http://localhost:3001/api/printers");
  return NextResponse.json(await res.json());
}

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch("http://localhost:3001/api/printers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return NextResponse.json(await res.json());
}
