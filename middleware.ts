import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // This will let requests pass through
  return NextResponse.next();
}

// Optional: specify which paths to apply the middleware to
export const config = {
  matcher: "/:path*", // apply to all paths
};