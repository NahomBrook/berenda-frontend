import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${API_BASE_URL}/properties`); // backend URL
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ message: "Failed to fetch properties" }, { status: 500 });
  }
}