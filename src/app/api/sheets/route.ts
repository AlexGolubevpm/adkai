import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSpreadsheetInfo } from "@/lib/google-sheets";

/** GET /api/sheets — list all sheet configs */
export async function GET() {
  try {
    const configs = await prisma.googleSheetConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Sheets list error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/** POST /api/sheets — create a new sheet config */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      spreadsheetId,
      sheetName,
      siteColumn,
      costColumn,
      dateColumn,
      usersColumn,
      headerRow,
      dataStartRow,
    } = body;

    if (!name || !spreadsheetId) {
      return NextResponse.json(
        { error: "name and spreadsheetId are required" },
        { status: 400 }
      );
    }

    // Validate access to the spreadsheet
    try {
      await getSpreadsheetInfo(spreadsheetId);
    } catch (err) {
      return NextResponse.json(
        {
          error: "Cannot access this spreadsheet. Make sure it is shared with the service account.",
          details: String(err),
        },
        { status: 400 }
      );
    }

    const config = await prisma.googleSheetConfig.create({
      data: {
        name,
        spreadsheetId,
        sheetName: sheetName || "Sheet1",
        siteColumn: siteColumn || "A",
        costColumn: costColumn || "B",
        dateColumn: dateColumn || "C",
        usersColumn: usersColumn || null,
        headerRow: headerRow || 1,
        dataStartRow: dataStartRow || 2,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error("Sheet config create error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
