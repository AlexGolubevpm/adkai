import { NextRequest, NextResponse } from "next/server";
import { getSpreadsheetInfo, previewSheet } from "@/lib/google-sheets";

/** POST /api/sheets/preview — preview a spreadsheet's structure and first rows */
export async function POST(req: NextRequest) {
  try {
    const { spreadsheetId, sheetName } = await req.json();

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "spreadsheetId is required" },
        { status: 400 }
      );
    }

    const info = await getSpreadsheetInfo(spreadsheetId);

    const targetSheet = sheetName || info.sheets[0]?.title || "Sheet1";
    const preview = await previewSheet(spreadsheetId, targetSheet, 5);

    return NextResponse.json({
      title: info.title,
      sheets: info.sheets.map((s) => s.title),
      preview,
      sheetName: targetSheet,
    });
  } catch (error) {
    console.error("Sheet preview error:", error);
    return NextResponse.json(
      {
        error: "Cannot access spreadsheet. Ensure it is shared with the service account.",
        details: String(error),
      },
      { status: 400 }
    );
  }
}
