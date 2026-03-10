import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lastSync = await prisma.syncRun.findFirst({
      where: { sourceType: "adok" },
      orderBy: { startedAt: "desc" },
    });

    const totalDays = await prisma.dailyStat.groupBy({
      by: ["statDate"],
    });

    return NextResponse.json({
      lastSync: lastSync
        ? {
            status: lastSync.runStatus,
            startedAt: lastSync.startedAt,
            finishedAt: lastSync.finishedAt,
            error: lastSync.errorText,
          }
        : null,
      totalDaysLoaded: totalDays.length,
    });
  } catch (error) {
    console.error("Sync status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
