import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/sheets/[id] — update a sheet config */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const config = await prisma.googleSheetConfig.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Sheet config update error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/** DELETE /api/sheets/[id] — delete a sheet config */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.googleSheetConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sheet config delete error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
