// prisma/seeds/seed-people.ts
//
// Seeds Staff, Parents and Students for both schools.
// Requires schools + 2026 academic year to already exist (run seed-demo.ts + seed-2026.ts first).
//
// Per school:
//   Staff   — 10 teaching + 4 non-teaching
//   Parents — 20 parents
//   Students— 4 per stream (P1–P7, East+West = 14 streams × 4 = 56 students)
//
// Usage: npx tsx prisma/seeds/seed-people.ts

import {
  PrismaClient,
  UserType,
  EnrollmentStatus,
  EnrollmentType,
  SubjectEnrollmentStatus,
  StaffType,
  StaffStatus,
  EmploymentType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const YEAR = "2026";
const SCHOOL_CODES = ["DPS", "DPS2"];

// ── helpers ───────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

let phoneSeq = 750_000_000;

async function initPhoneSeq() {
  // Find the highest existing phone to avoid collisions
  const users = await db.user.findMany({
    select: { phone: true },
    orderBy: { phone: "desc" },
    take: 1,
  });
  if (users.length) {
    const n = parseInt(users[0].phone.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > phoneSeq) phoneSeq = n;
  }
}

const nextPhone = () => `0${String(++phoneSeq)}`;

let admSeq = 0;

async function initAdmSeq(schoolCode: string) {
  const prefix = `${schoolCode}ADM`;
  const last = await db.student.findFirst({
    where:   { admissionNo: { startsWith: prefix } },
    orderBy: { admissionNo: "desc" },
    select:  { admissionNo: true },
  });
  if (last) {
    const n = parseInt(last.admissionNo.slice(prefix.length + 6), 10); // skip YYYYMM
    if (!isNaN(n)) admSeq = n;
  } else {
    admSeq = 0;
  }
}

function nextAdm(schoolCode: string): string {
  const now   = new Date();
  const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${schoolCode}ADM${ym}${String(++admSeq).padStart(2, "0")}`;
}

let staffSeq = 0;
const nextStaffId = (code: string) => `${code}STF${String(++staffSeq).padStart(3, "0")}`;

// ── name pools ────────────────────────────────────────────────────────────────
const MALE_FIRST   = ["Robert","John","David","Moses","Peter","Paul","Joseph","Samuel","Daniel","Michael","Emmanuel","Isaac","Joshua","Andrew","George"];
const FEMALE_FIRST = ["Grace","Mary","Sarah","Ruth","Esther","Lydia","Miriam","Deborah","Judith","Naomi","Priscilla","Agnes","Florence","Beatrice","Harriet"];
const LAST_NAMES   = ["Ssebulime","Kato","Mugisha","Tumwine","Byarugaba","Wasswa","Nsubuga","Lubega","Tusiime","Asiimwe","Okello","Atim","Ochieng","Namukasa","Nalwoga"];
const OCCUPATIONS  = ["Teacher","Farmer","Business Person","Civil Servant","Doctor","Nurse","Accountant","Driver","Trader","Engineer"];
const RELATIONSHIPS = ["Father","Mother","Guardian"];
const RELIGIONS    = ["Catholic","Protestant","Muslim","SDA","Pentecostal"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const QUALIFICATIONS = ["Certificate in Education","Diploma in Education","Bachelor of Education","Bachelor of Arts","Bachelor of Science"];
const SPECIALIZATIONS = ["Mathematics","English","Science","Social Studies","Religious Education","Agriculture","Local Language","General Teaching"];
const STAFF_ROLES_TEACHING     = ["Class Teacher","Subject Teacher","Senior Teacher"];
const STAFF_ROLES_NON_TEACHING = ["School Bursar","School Secretary","Librarian","Lab Technician"];

function randomDob(minAge: number, maxAge: number): Date {
  const year = new Date().getFullYear() - rnd(minAge, maxAge);
  return new Date(year, rnd(0, 11), rnd(1, 28));
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n🚀 Seeding Staff, Parents & Students\n" + "─".repeat(50));

  const hashedPassword = await bcrypt.hash("Password@123", 10);
  await initPhoneSeq();

  const schools = await db.school.findMany({
    where:  { code: { in: SCHOOL_CODES } },
    select: { id: true, name: true, code: true },
  });

  if (!schools.length) {
    console.error("❌ No schools found. Run seed-demo.ts first.");
    process.exit(1);
  }

  for (const school of schools) {
    console.log(`\n🏫 ${school.name} (${school.code})`);
    await seedSchool(school, hashedPassword);
  }

  console.log("\n" + "─".repeat(50));
  console.log("✅ Done!\n");
  console.log("Login credentials (all): Password@123");
  console.log("Student login: loginId = admissionNo, password = admissionNo\n");
}

// ════════════════════════════════════════════════════════════════════════════
// PER-SCHOOL SEED
// ════════════════════════════════════════════════════════════════════════════

async function seedSchool(
  school: { id: string; name: string; code: string },
  hashedPassword: string
) {
  // Get 2026 academic year
  const academicYear = await db.academicYear.findUnique({
    where: { year_schoolId: { year: YEAR, schoolId: school.id } },
  });
  if (!academicYear) {
    console.log(`  ⚠  No ${YEAR} academic year — run seed-2026.ts first`);
    return;
  }

  // Get Term 1
  const term1 = await db.academicTerm.findFirst({
    where: { academicYearId: academicYear.id, termNumber: 1 },
  });
  if (!term1) { console.log("  ⚠  Term 1 not found"); return; }

  await seedStaff(school, hashedPassword);
  const parentIds = await seedParents(school, hashedPassword);
  await seedStudents(school, academicYear.id, term1.id, parentIds, hashedPassword);
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF  (10 teaching + 4 non-teaching)
// ════════════════════════════════════════════════════════════════════════════

async function seedStaff(
  school: { id: string; code: string },
  hashedPassword: string
) {
  const defs = [
    ...Array.from({ length: 10 }, (_, i) => ({ type: StaffType.TEACHING,     role: pick(STAFF_ROLES_TEACHING),     i })),
    ...Array.from({ length: 4  }, (_, i) => ({ type: StaffType.NON_TEACHING, role: pick(STAFF_ROLES_NON_TEACHING), i })),
  ];

  let created = 0;
  for (const def of defs) {
    const gender    = def.i % 2 === 0 ? "Male" : "Female";
    const firstName = gender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName  = pick(LAST_NAMES);
    const email     = `staff.${school.code.toLowerCase()}.${String(staffSeq + 1).padStart(3,"0")}@demo.ug`;
    const staffId   = nextStaffId(school.code);

    // Skip if email already taken
    const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) continue;

    const phone = nextPhone();

    const user = await db.user.create({
      data: {
        name: `${firstName} ${lastName}`, firstName, lastName,
        phone, email, password: hashedPassword,
        userType: UserType.STAFF, schoolId: school.id,
        status: true, isVerfied: true,
      },
    });

    await db.staff.create({
      data: {
        staffId, schoolId: school.id, userId: user.id,
        firstName, lastName, gender,
        dob:            randomDob(25, 55),
        nationality:    "Ugandan",
        phone,
        email,
        address:        "Kampala, Uganda",
        religion:       pick(RELIGIONS),
        staffType:      def.type,
        employmentType: EmploymentType.PERMANENT,
        status:         StaffStatus.ACTIVE,
        dateOfHire:     new Date("2025-01-15"),
        basicSalary:    def.type === StaffType.TEACHING ? rnd(600000, 1200000) : rnd(400000, 800000),
        highestQualification: pick(QUALIFICATIONS),
        specialization: def.type === StaffType.TEACHING ? pick(SPECIALIZATIONS) : def.role,
      },
    });
    created++;
  }

  console.log(`  ✓ ${created} staff members (10 teaching + 4 non-teaching)`);
}

// ════════════════════════════════════════════════════════════════════════════
// PARENTS  (20 per school)
// ════════════════════════════════════════════════════════════════════════════

async function seedParents(
  school: { id: string; code: string },
  hashedPassword: string
): Promise<string[]> {
  const parentIds: string[] = [];

  for (let i = 0; i < 20; i++) {
    const gender    = i % 2 === 0 ? "Male" : "Female";
    const firstName = gender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName  = pick(LAST_NAMES);
    const email     = `parent.${school.code.toLowerCase()}.${String(i + 1).padStart(2, "0")}@demo2026.ug`;

    let parent = await db.parent.findFirst({ where: { email }, select: { id: true } });
    if (parent) { parentIds.push(parent.id); continue; }

    const phone = nextPhone();

    const user = await db.user.create({
      data: {
        name: `${firstName} ${lastName}`, firstName, lastName,
        phone, email, password: hashedPassword,
        userType: UserType.PARENT, schoolId: school.id,
        status: true, isVerfied: true,
      },
    });

    parent = await db.parent.create({
      data: {
        firstName, lastName, name: `${firstName} ${lastName}`,
        phone, email, gender,
        relationship: pick(RELATIONSHIPS),
        occupation:   pick(OCCUPATIONS),
        address:      "Kampala, Uganda",
        religion:     pick(RELIGIONS),
        userId:       user.id,
        schoolId:     school.id,
      },
      select: { id: true },
    });

    parentIds.push(parent.id);
  }

  console.log(`  ✓ ${parentIds.length} parents`);
  return parentIds;
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENTS  (4 per stream, enrolled + subject-enrolled in Term 1)
// ════════════════════════════════════════════════════════════════════════════

async function seedStudents(
  school:        { id: string; code: string },
  academicYearId: string,
  term1Id:        string,
  parentIds:      string[],
  hashedPassword: string
) {
  // Reset seq for this school
  await initAdmSeq(school.code);
  const streams = await db.stream.findMany({
    where:  { schoolId: school.id, classYear: { academicYearId } },
    select: { id: true, classYearId: true },
  });

  if (!streams.length) {
    console.log("  ⚠  No streams found — run seed-2026.ts first");
    return;
  }

  // Pre-fetch all stream subjects for term 1
  const allSS = await db.streamSubject.findMany({
    where:  { streamId: { in: streams.map(s => s.id) }, termId: term1Id, isActive: true },
    select: { id: true, streamId: true },
  });
  const ssByStream: Record<string, string[]> = {};
  for (const ss of allSS) {
    if (!ssByStream[ss.streamId]) ssByStream[ss.streamId] = [];
    ssByStream[ss.streamId].push(ss.id);
  }

  let totalStudents = 0;
  let parentIdx     = 0;

  // Process streams in batches of 2 to reduce round trips
  for (const stream of streams) {
    const ssIds = ssByStream[stream.id] ?? [];

    for (let s = 0; s < 4; s++) {
      const gender    = s % 2 === 0 ? "Male" : "Female";
      const firstName = gender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
      const lastName  = pick(LAST_NAMES);
      const admNo     = nextAdm(school.code);
      const phone     = nextPhone();
      const parentId  = parentIds[parentIdx % parentIds.length];
      parentIdx++;

      // Single transaction per student — 1 round trip instead of 3
      await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: `${firstName} ${lastName}`, firstName, lastName,
            phone, password: hashedPassword,
            userType: UserType.STUDENT, loginId: admNo,
            schoolId: school.id, status: true, isVerfied: false,
          },
          select: { id: true },
        });

        const student = await tx.student.create({
          data: {
            admissionNo: admNo, firstName, lastName,
            dob:         randomDob(5, 14), gender,
            nationality: "Ugandan", religion: pick(RELIGIONS),
            bloodGroup:  pick(BLOOD_GROUPS), parentId,
            schoolId:    school.id, userId: user.id,
            admissionDate: new Date(), isActive: true,
          },
          select: { id: true },
        });

        const enrollment = await tx.enrollment.create({
          data: {
            studentId: student.id, classYearId: stream.classYearId,
            streamId: stream.id, academicYearId, termId: term1Id,
            enrollmentType: EnrollmentType.NEW, status: EnrollmentStatus.ACTIVE,
          },
          select: { id: true },
        });

        if (ssIds.length > 0) {
          await tx.studentSubjectEnrollment.createMany({
            data: ssIds.map(ssId => ({
              enrollmentId: enrollment.id, streamSubjectId: ssId,
              status: SubjectEnrollmentStatus.ACTIVE,
              isCompulsory: true, isAutoEnrolled: true,
            })),
            skipDuplicates: true,
          });
        }
      });

      totalStudents++;
    }
  }

  console.log(`  ✓ ${totalStudents} students across ${streams.length} streams`);
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
