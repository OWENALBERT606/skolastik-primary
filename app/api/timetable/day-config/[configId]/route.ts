// DELETE /api/timetable/day-config/[configId]
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { db } from "@/prisma/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    await getAuthenticatedUser();
    const { configId } = await params;
    await db.schoolDayConfig.delete({ where: { id: configId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
