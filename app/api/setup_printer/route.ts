import { NextResponse } from "next/server";

export async function GET() {
  // Get local IP address for QR code generation
  // In production, detect actual network interface IP
  const localIp = "192.168.1.100"; // Mock

  return NextResponse.json({
    success: true,
    localIp,
    url: `http://${localIp}`,
    hostname: "forgeos.local",
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { printerName, moonrakerUrl } = body;

  if (!printerName || !moonrakerUrl) {
    return NextResponse.json(
      { success: false, error: "Printer name and Moonraker URL are required" },
      { status: 400 }
    );
  }

  // In production: Test connection to Moonraker
  // try {
  //   const response = await fetch(`${moonrakerUrl}/server/info`);
  //   if (!response.ok) throw new Error('Connection failed');
  // } catch {
  //   return NextResponse.json({ success: false, error: 'Cannot connect to Moonraker' }, { status: 400 });
  // }

  return NextResponse.json({
    success: true,
    message: `Printer "${printerName}" configured successfully`,
    printer: {
      name: printerName,
      url: moonrakerUrl,
    },
  });
}
