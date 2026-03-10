import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const runs = await prisma.analysisRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        periodFrom: true,
        periodTo: true,
        triggerType: true,
        summaryText: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Analysis history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
