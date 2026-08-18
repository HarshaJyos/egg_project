import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Use a temp file to share state reliably across serverless invocations
const STATUS_FILE = path.join("/tmp", "payment_status_vending.json");

function getStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, "utf-8");
      return JSON.parse(data).status;
    }
  } catch (e) {
    console.error("Error reading payment status:", e);
  }
  return "PENDING";
}

function setStatus(status: string) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status }), "utf-8");
  } catch (e) {
    console.error("Error writing payment status:", e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const newStatus = searchParams.get("status");

  // Allow setting status
  if (action === "set" && newStatus) {
    setStatus(newStatus);
    return NextResponse.json({ success: true, status: newStatus });
  }

  // Return current status
  const currentStatus = getStatus();
  return NextResponse.json({ status: currentStatus });
}
