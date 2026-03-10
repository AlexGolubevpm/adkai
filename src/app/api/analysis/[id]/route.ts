import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const run = await prisma.analysisRun.findUnique({ where: { id } });

    if (!run) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: run.id,
      periodFrom: run.periodFrom,
      periodTo: run.periodTo,
      triggerType: run.triggerType,
      requestPayload: run.requestPayload,
      responsePayload: run.responsePayload,
      summaryText: run.summaryText,
      createdAt: run.createdAt,
    });
  } catch (error) {
    console.error("Analysis detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
