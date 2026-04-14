// POST /api/timetable/versions/[versionId]/publish
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { publishTimetableVersion } from "@/lib/timetable/service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { versionId } = await params;

    const version = await publishTimetableVersion({
      versionId,
      publishedByUserId: user.id,
    });

    return NextResponse.json({ version });
  } catch (e: any) {
    const status = e.message?.includes("Cannot publish") ? 409 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
