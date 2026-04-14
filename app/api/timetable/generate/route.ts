// POST /api/timetable/generate
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { runTimetableGeneration } from "@/lib/timetable/service";
import { GenerateTimetableSchema } from "@/lib/timetable/types";

export async function POST(req: NextRequest) {
  try {
    const user   = await getAuthenticatedUser();
    const body   = await req.json();
    const parsed = GenerateTimetableSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const result = await runTimetableGeneration({
      ...parsed.data,
      generatedById: user.id,
    });

    const status = result.success ? 201 : 207; // 207 = partial success
    return NextResponse.json({
      ...result,
      generationStats: result.generationStats,
    }, { status });
  } catch (e: any) {
    if (e?.digest?.startsWith("NEXT_REDIRECT") || e?.digest?.startsWith("NEXT_NOT_FOUND")) throw e;
    console.error("[generate] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
