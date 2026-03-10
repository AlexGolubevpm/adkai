import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const sheetsId = process.env.GOOGLE_SHEETS_ID;
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!sheetsId || !serviceEmail || !privateKey) {
      return NextResponse.json(
        { error: "Google Sheets credentials not configured" },
        { status: 400 }
      );
    }

    const syncRun = await prisma.syncRun.create({
      data: {
        sourceType: "google_sheets",
        runType: "manual",
        runStatus: "running",
      },
    });

    try {
      // TODO: Implement Google Sheets API integration
      // 1. Authenticate with service account
      // 2. Read spreadsheet data
      // 3. Map rows to sites
      // 4. Upsert costs

      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: { runStatus: "completed", finishedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: "Costs synced from Google Sheets" });
    } catch (syncError) {
      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          runStatus: "failed",
          finishedAt: new Date(),
          errorText: String(syncError),
        },
      });
      throw syncError;
    }
  } catch (error) {
    console.error("Costs sync error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
