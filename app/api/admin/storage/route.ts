import { NextResponse }            from "next/server";
import { getServerSession }        from "next-auth/next";
import { authOptions }             from "@/config/auth";
import { db }                      from "@/prisma/db";
import { getDbStoragePerSchool, getTotalDbSize } from "@/lib/storage/getDbStoragePerSchool";
import { getR2StoragePerSchool }   from "@/lib/storage/getR2StoragePerSchool";

export const dynamic = "force-dynamic";

export async function GET() {
  // ── Auth guard — superadmin only ──────────────────────────────────────────
  const session = await getServerSession(authOptions);
  const roles   = ((session as any)?.user?.roles ?? []).map((r: any) => (r.roleName ?? "").toLowerCase());
  const isAdmin = roles.some((r: string) => r.includes("admin") || r.includes("super"));
  if (!session || !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch all schools ─────────────────────────────────────────────────────
  const schools = await db.school.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // ── Total actual DB size from PostgreSQL ──────────────────────────────────
  const totalDbSize = await getTotalDbSize();

  // ── Per-school storage ────────────────────────────────────────────────────
  const results = await Promise.all(
    schools.map(async (school) => {
      const [dbBytes, r2Bytes] = await Promise.all([
        getDbStoragePerSchool(school.id),
        getR2StoragePerSchool(school.id),
      ]);
      return {
        schoolId:   school.id,
        schoolName: school.name,
        dbBytes,
        r2Bytes,
        totalBytes: dbBytes + r2Bytes,
      };
    })
  );

  results.sort((a, b) => b.totalBytes - a.totalBytes);

  return NextResponse.json({ totalDbSize, schools: results }, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}
