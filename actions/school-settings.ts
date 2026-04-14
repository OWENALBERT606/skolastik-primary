// actions/school-settings.ts
"use server";

import { db }            from "@/prisma/db";
import { revalidatePath } from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type SchoolProfileInput = {
  name:     string;
  motto:    string | null;
  address:  string | null;
  contact:  string | null;
  contact2: string | null;
  contact3: string | null;
  email:    string | null;
  email2:   string | null;
  website:  string | null;
  logo:     string | null;
};

export type SchoolColorsInput = {
  primaryColor: string | null;
  accentColor:  string | null;
};

// ════════════════════════════════════════════════════════════════════════════
// FETCH
// ════════════════════════════════════════════════════════════════════════════

export async function getSchoolSettings(schoolId: string) {
  try {
    // Select base fields via Prisma, then fetch color fields via raw query
    // (raw query needed until `npx prisma generate` is re-run after migration)
    const school = await db.school.findUnique({
      where:  { id: schoolId },
      select: {
        id: true, name: true, motto: true, slug: true, code: true,
        address: true, contact: true, contact2: true, contact3: true,
        email: true, email2: true, website: true, logo: true,
        division: true, isActive: true,
      },
    });
    if (!school) return { ok: false as const, message: "School not found" };

    // Fetch color fields separately via raw SQL
    const colorRows = await db.$queryRaw<{ primaryColor: string | null; accentColor: string | null }[]>`
      SELECT "primaryColor", "accentColor" FROM "School" WHERE "id" = ${schoolId} LIMIT 1
    `;
    const colors = colorRows[0] ?? { primaryColor: null, accentColor: null };

    return { ok: true as const, data: { ...school, primaryColor: colors.primaryColor, accentColor: colors.accentColor } };
  } catch (error: any) {
    console.error("❌ getSchoolSettings:", error);
    return { ok: false as const, message: "Failed to load school settings" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ════════════════════════════════════════════════════════════════════════════

export async function updateSchoolProfile(schoolId: string, data: SchoolProfileInput, slug: string) {
  try {
    if (!data.name?.trim()) {
      return { ok: false as const, message: "School name is required" };
    }

    await db.school.update({
      where: { id: schoolId },
      data: {
        name:     data.name.trim(),
        motto:    data.motto?.trim()    || null,
        address:  data.address?.trim()  || null,
        contact:  data.contact?.trim()  || null,
        contact2: data.contact2?.trim() || null,
        contact3: data.contact3?.trim() || null,
        email:    data.email?.trim()    || null,
        email2:   data.email2?.trim()   || null,
        website:  data.website?.trim()  || null,
        logo:     data.logo             ?? null,
      },
    });

    revalidatePath(`/school/${slug}/settings/profile`);
    revalidatePath(`/school/${slug}`);

    return { ok: true as const, message: "School profile updated" };
  } catch (error: any) {
    console.error("❌ updateSchoolProfile:", error);
    return { ok: false as const, message: error.message ?? "Failed to update profile" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE COLORS
// ════════════════════════════════════════════════════════════════════════════

export async function updateSchoolColors(schoolId: string, data: SchoolColorsInput, slug: string) {
  try {
    // Validate hex format
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    if (data.primaryColor && !hexRe.test(data.primaryColor)) {
      return { ok: false as const, message: "Invalid primary color format" };
    }
    if (data.accentColor && !hexRe.test(data.accentColor)) {
      return { ok: false as const, message: "Invalid accent color format" };
    }

    // Use raw SQL so this works even before `npx prisma generate` is re-run
    await db.$executeRaw`
      UPDATE "School"
      SET "primaryColor" = ${data.primaryColor ?? null},
          "accentColor"  = ${data.accentColor  ?? null},
          "updatedAt"    = NOW()
      WHERE "id" = ${schoolId}
    `;

    revalidatePath(`/school/${slug}/settings/appearance`);
    revalidatePath(`/school/${slug}`);

    return { ok: true as const, message: "School colors updated" };
  } catch (error: any) {
    console.error("❌ updateSchoolColors:", error);
    return { ok: false as const, message: error.message ?? "Failed to update colors" };
  }
}
