import { NextRequest, NextResponse } from "next/server";
import { mockTriggerAutomation } from "@/lib/mock/n8n";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await mockTriggerAutomation(id, {});
  // TODO: Replace with real n8n webhook call
  return NextResponse.json(result);
}
