import { NextResponse } from "next/server";

// Minimal placeholder to satisfy Next.js route module requirements.
// This route is not used by the current frontend payment/booking flow.
export async function GET() {
  return NextResponse.json({ message: "Auth API route not implemented." }, { status: 501 });
}
