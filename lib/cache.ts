// lib/cache.ts
// Server-side caching utilities using Next.js unstable_cache
// Use these wrappers around expensive DB queries that don't change per-request.

import { unstable_cache } from "next/cache";
import { db }             from "@/prisma/db";

// ────────────────────────────────────────────────────────────────────────────
// SCHOOL — slug → id/name lookup (changes rarely, safe to cache 5 min)
// ────────────────────────────────────────────────────────────────────────────

export const getCachedSchoolBySlug = unstable_cache(
  async (slug: string) => {
    return db.school.findUnique({
      where:  { slug },
      select: {
        id:           true,
        name:         true,
        slug:         true,
        code:         true,
        logo:         true,
        primaryColor: true,
        accentColor:  true,
        division:     true,
        isActive:     true,
      },
    });
  },
  ["school-by-slug"],
  { revalidate: 300, tags: ["school"] }, // 5 min
);

// ────────────────────────────────────────────────────────────────────────────
// ACTIVE ACADEMIC YEAR + ACTIVE TERM (per school, changes ~3× per year)
// ────────────────────────────────────────────────────────────────────────────

export const getCachedActiveYear = unstable_cache(
  async (schoolId: string) => {
    return db.academicYear.findFirst({
      where:   { schoolId, isActive: true },
      select: {
        id:   true,
        year: true,
        terms: {
          where:   { isActive: true },
          select:  { id: true, name: true, termNumber: true },
          orderBy: { termNumber: "asc" },
          take: 1,
        },
      },
    });
  },
  ["active-year"],
  { revalidate: 600, tags: ["academic-year"] }, // 10 min
);

// ────────────────────────────────────────────────────────────────────────────
// CLASS TEMPLATES (per school — changes rarely)
// ────────────────────────────────────────────────────────────────────────────

export const getCachedClassTemplates = unstable_cache(
  async (schoolId: string) => {
    return db.classTemplate.findMany({
      where:   { schoolId },
      select:  { id: true, name: true, code: true, level: true },
      orderBy: { name: "asc" },
    });
  },
  ["class-templates"],
  { revalidate: 3600, tags: ["class-templates"] }, // 1 hour
);

// ────────────────────────────────────────────────────────────────────────────
// SUBJECTS (per school — changes rarely)
// ────────────────────────────────────────────────────────────────────────────

export const getCachedSubjects = unstable_cache(
  async (schoolId: string) => {
    return db.subject.findMany({
      where:   { schoolId, isActive: true },
      select:  { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  },
  ["subjects"],
  { revalidate: 3600, tags: ["subjects"] }, // 1 hour
);

// ────────────────────────────────────────────────────────────────────────────
// FEE CATEGORIES (per school — changes rarely)
// ────────────────────────────────────────────────────────────────────────────

export const getCachedFeeCategories = unstable_cache(
  async (schoolId: string) => {
    return db.feeCategory.findMany({
      where:   { schoolId, isActive: true },
      select:  { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
  },
  ["fee-categories"],
  { revalidate: 3600, tags: ["fee-categories"] }, // 1 hour
);

// ────────────────────────────────────────────────────────────────────────────
// GRADING CONFIG (per school — changes rarely)
// ────────────────────────────────────────────────────────────────────────────

export const getCachedGradingConfig = unstable_cache(
  async (schoolId: string) => {
    return db.gradingConfig.findFirst({
      where:  { schoolId, isActive: true },
      select: {
        id:               true,
        gradingScaleType: true,
        aoiPercentage:    true,
        examPercentage:   true,
        gradeBoundaries:  { select: { id: true, grade: true, minPercentage: true, maxPercentage: true, points: true } },
      },
    });
  },
  ["grading-config"],
  { revalidate: 3600, tags: ["grading-config"] }, // 1 hour
);
