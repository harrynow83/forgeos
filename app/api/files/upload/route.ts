import { NextResponse } from "next/server";

const BASE = "http://localhost:3001";

export async function POST(req: Request) {
  const form = await req.formData();

  const res = await fetch(`${BASE}/api/files/upload`, {
    method: "POST",
    body: form,
  });

  return NextResponse.json(await res.json());
}
