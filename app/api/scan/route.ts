
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    id: "dummy-report-123",
    message: "Scan API is working!",
  });
}

export async function GET() {
  return NextResponse.json({
    message: "Scan API is running",
  });
}
