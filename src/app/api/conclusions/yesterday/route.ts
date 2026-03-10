import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const conclusions = await prisma.conclusionDaily.findMany({
      where: { statDate: yesterday },
      orderBy: [{ category: "asc" }, { metricValue: "desc" }],
    });

    const grouped = {
      worstSites: conclusions.filter(
        (c) => c.category === "worst" && c.entityType === "site"
      ),
      bestSites: conclusions.filter(
        (c) => c.category === "best" && c.entityType === "site"
      ),
      worstFormats: conclusions.filter(
        (c) => c.category === "worst" && c.entityType === "format"
      ),
      bestFormats: conclusions.filter(
        (c) => c.category === "best" && c.entityType === "format"
      ),
    };

    return NextResponse.json({
      date: yesterday.toISOString().split("T")[0],
      conclusions: grouped,
    });
  } catch (error) {
    console.error("Conclusions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
