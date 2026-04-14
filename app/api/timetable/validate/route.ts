// POST /api/timetable/validate
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/config/useAuth";
import { validateGenerationReadiness } from "@/lib/timetable/validate";
import { z } from "zod";

const Schema = z.object({
  schoolId:       z.string().cuid(),
  academicYearId: z.string().cuid(),
  termId:         z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    await getAuthenticatedUser();
    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const result = await validateGenerationReadiness(
      parsed.data.schoolId,
      parsed.data.academicYearId,
      parsed.data.termId,
    );

    return NextResponse.json(result);
  } catch (e: any) {
    // Re-throw Next.js redirect/notFound errors — don't swallow them
    if (e?.digest?.startsWith("NEXT_REDIRECT") || e?.digest?.startsWith("NEXT_NOT_FOUND")) throw e;
    console.error("[validate] error:", e);
    return NextResponse.json({ error: e.message ?? "Internal server error" }, { status: 500 });
  }
}
