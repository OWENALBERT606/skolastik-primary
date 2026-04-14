// prisma/seeds/seed-staff.ts
//
// Creates 30 realistic Ugandan staff members for a given school.
// Safe to run even when staff already exist — all uniqueness checks
// are done against the live DB before creating anything.
//
// Usage:
//   npx ts-node prisma/seeds/seed-staff.ts <schoolId>

import {
  PrismaClient,
  StaffType,
  EmploymentType,
  StaffStatus,
  // FIX [1]: Import UserType and TeacherStatus for enum-safe values
  UserType,
  TeacherStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end   = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

// In-memory sequence cache so sequential calls in the loop don't
// collide with each other before each DB write completes
const seqCache: Record<string, number> = {};

async function generateStaffId(schoolId: string): Promise<string> {
  const now    = new Date();
  const year   = now.getFullYear();
  const month  = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `STF${year}${month}`;
  const key    = `${schoolId}:${prefix}`;

  if (seqCache[key] === undefined) {
    const latest = await db.staff.findFirst({
      where:   { schoolId, staffId: { startsWith: prefix } },
      orderBy: { staffId: "desc" },
      select:  { staffId: true },
    });
    let seq = 0;
    if (latest?.staffId) {
      const parsed = parseInt(latest.staffId.slice(prefix.length), 10);
      if (!isNaN(parsed)) seq = parsed;
    }
    seqCache[key] = seq;
  }

  while (true) {
    seqCache[key]++;
    const candidate = `${prefix}${String(seqCache[key]).padStart(3, "0")}`;
    const conflict = await db.user.findUnique({
      where: { schoolId_loginId: { schoolId, loginId: candidate } },
    });
    if (!conflict) return candidate;
  }
}

async function generateUniquePhone(
  schoolId: string,
  usedInRun: Set<string>
): Promise<string | null> {
  const prefixes = ["0701", "0702", "0703", "0704", "0705", "0772", "0782", "0752", "0756", "0753"];

  for (let attempt = 0; attempt < 30; attempt++) {
    const phone = `${randomFrom(prefixes)}${String(Math.floor(100000 + Math.random() * 900000))}`;
    if (usedInRun.has(phone)) continue;

    const [staffConflict, userConflict] = await Promise.all([
      db.staff.findFirst({ where: { phone } }),
      db.user.findFirst({ where: { phone } }),
    ]);
    if (!staffConflict && !userConflict) return phone;
  }

  return null;
}

async function generateUniqueEmail(
  firstName: string,
  lastName: string,
  usedInRun: Set<string>
): Promise<string | null> {
  const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

  for (let suffix = 1; suffix <= 50; suffix++) {
    const email = suffix === 1
      ? `${base}@somalite.sch.ug`
      : `${base}${suffix}@somalite.sch.ug`;

    if (usedInRun.has(email)) continue;

    const [s, u, t] = await Promise.all([
      db.staff.findFirst({ where: { email } }),
      db.user.findFirst({ where: { email } }),
      db.teacher.findFirst({ where: { email } }),
    ]);
    if (!s && !u && !t) return email;
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// UGANDAN STAFF DATA
// ════════════════════════════════════════════════════════════════════════════

const FIRST_NAMES_MALE = [
  "Ssekandi", "Mugisha", "Okello", "Tumwesigye", "Byamugisha",
  "Kizza", "Musoke", "Ssemanda", "Lubega", "Waiswa",
  "Ochieng", "Opolot", "Muwanguzi", "Ssali", "Tendo",
  "Kato", "Waswa", "Kabugo", "Ssebuufu", "Mulindwa",
];

const FIRST_NAMES_FEMALE = [
  "Nakato", "Namukasa", "Nalwoga", "Akello", "Auma",
  "Nansubuga", "Nabirye", "Namusoke", "Atuhaire", "Nankya",
  "Nassazi", "Namatovu", "Akinyi", "Birungi", "Kemigisha",
  "Nabbosa", "Nabwire", "Tumusiime", "Ainembabazi", "Kyomuhendo",
];

const LAST_NAMES = [
  "Ssebulime", "Kato", "Mugisha", "Tumwine", "Byarugaba",
  "Okwir", "Atim", "Opio", "Wasswa", "Nsubuga",
  "Ssekitoleko", "Lubega", "Mugenyi", "Tusiime", "Kabagambe",
  "Namanya", "Rwabugiri", "Asiimwe", "Kyomukama", "Ninsiima",
  "Bwambale", "Kakonge", "Mwesigwa", "Ntambi", "Sekimpi",
];

const QUALIFICATIONS = [
  "Bachelor of Education",
  "Bachelor of Science",
  "Bachelor of Arts",
  "Master of Education",
  "Diploma in Education",
  "Bachelor of Commerce",
  "Bachelor of Business Administration",
  "Diploma in Secretarial Studies",
  "Certificate in Education",
  "Bachelor of Library & Information Science",
];

const SPECIALIZATIONS = [
  "Mathematics & Physics",
  "English Language & Literature",
  "Biology & Chemistry",
  "History & Political Education",
  "Geography & Economics",
  "Computer Science & ICT",
  "Physical Education & Sports",
  "Fine Art & Design",
  "Accounts & Business Studies",
  "Agriculture & Environmental Science",
];

const INSTITUTIONS = [
  "Makerere University",
  "Kyambogo University",
  "Mbarara University of Science and Technology",
  "Uganda Christian University",
  "Kampala International University",
  "Islamic University in Uganda",
  "Uganda Martyrs University",
  "Mountains of the Moon University",
  "Gulu University",
  "Busitema University",
];

const UGANDAN_DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Mbarara",
  "Gulu", "Lira", "Fort Portal", "Mbale", "Soroti",
];

const STAFF_TEMPLATES: {
  gender: "Male" | "Female";
  staffType: StaffType;
  roleCode: string;
  employmentType: EmploymentType;
}[] = [
  // ── Leadership (3) ──────────────────────────────────────────────────────
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "HEAD_TEACHER", employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "DEPUTY_HEAD",  employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "DOS",          employmentType: EmploymentType.PERMANENT },

  // ── Permanent teachers (8) ───────────────────────────────────────────────
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PERMANENT },

  // ── Contract teachers (4) ────────────────────────────────────────────────
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.CONTRACT  },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.CONTRACT  },
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.CONTRACT  },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.CONTRACT  },

  // ── Part-time teachers (2) ───────────────────────────────────────────────
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PART_TIME },
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "TEACHER",      employmentType: EmploymentType.PART_TIME },

  // ── Specialist teaching roles (2) ────────────────────────────────────────
  { gender: "Female", staffType: StaffType.TEACHING,     roleCode: "COUNSELOR",    employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.TEACHING,     roleCode: "COUNSELOR",    employmentType: EmploymentType.CONTRACT  },

  // ── Administration (4) ───────────────────────────────────────────────────
  { gender: "Female", staffType: StaffType.NON_TEACHING, roleCode: "SECRETARY",    employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "ACCOUNTANT",   employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "ADMIN",        employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "IT_OFFICER",   employmentType: EmploymentType.CONTRACT  },

  // ── Specialist support (3) ───────────────────────────────────────────────
  { gender: "Female", staffType: StaffType.NON_TEACHING, roleCode: "LIBRARIAN",    employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "STORE_KEEPER", employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.NON_TEACHING, roleCode: "NURSE",        employmentType: EmploymentType.CONTRACT  },

  // ── General support (5) ──────────────────────────────────────────────────
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "SECURITY",     employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "SECURITY",     employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.NON_TEACHING, roleCode: "COOK",         employmentType: EmploymentType.PERMANENT },
  { gender: "Female", staffType: StaffType.NON_TEACHING, roleCode: "CLEANER",      employmentType: EmploymentType.PERMANENT },
  { gender: "Male",   staffType: StaffType.NON_TEACHING, roleCode: "DRIVER",       employmentType: EmploymentType.CONTRACT  },
];

const SALARY_BY_ROLE: Record<string, number> = {
  HEAD_TEACHER:  2_800_000,
  DEPUTY_HEAD:   2_200_000,
  DOS:           2_000_000,
  TEACHER:       1_200_000,
  COUNSELOR:     1_100_000,
  SECRETARY:       900_000,
  ACCOUNTANT:    1_500_000,
  ADMIN:           900_000,
  IT_OFFICER:    1_200_000,
  LIBRARIAN:       800_000,
  STORE_KEEPER:    750_000,
  NURSE:         1_000_000,
  SECURITY:        600_000,
  COOK:            550_000,
  CLEANER:         500_000,
  DRIVER:          700_000,
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

export async function seedStaff(schoolId: string) {
  console.log(`\n🌱 Seeding 30 staff members for school: ${schoolId}\n`);

  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { id: true, name: true },
  });
  if (!school) throw new Error(`School not found: ${schoolId}`);

  console.log(`🏫 School: ${school.name}`);

  const existingCount = await db.staff.count({ where: { schoolId } });
  console.log(`👥 Existing staff: ${existingCount}\n`);

  const roleDefs = await db.staffRoleDefinition.findMany({
    where:  { schoolId, isActive: true },
    select: { id: true, code: true, name: true },
  });

  if (roleDefs.length === 0) {
    throw new Error(
      `No role definitions found for school ${schoolId}.\n` +
      `Run first: npx ts-node prisma/seeds/staff-role-definitions.ts ${schoolId}`
    );
  }

  const roleMap        = Object.fromEntries(roleDefs.map((r) => [r.code, r]));
  const hashedPassword = await bcrypt.hash("Password@123", 10);

  const usedPhones = new Set<string>();
  const usedEmails = new Set<string>();

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < STAFF_TEMPLATES.length; i++) {
    const template = STAFF_TEMPLATES[i];
    const roleDef  = roleMap[template.roleCode];
    const num      = String(i + 1).padStart(2, "0");

    if (!roleDef) {
      console.warn(`  ⚠️  [${num}] Role "${template.roleCode}" not found — skipped`);
      skipped++;
      continue;
    }

    const namePool  = template.gender === "Male" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    const firstName = randomFrom(namePool);
    const lastName  = randomFrom(LAST_NAMES);
    const fullName  = `${firstName} ${lastName}`;

    const phone = await generateUniquePhone(schoolId, usedPhones);
    if (!phone) {
      console.warn(`  ⚠️  [${num}] Could not get unique phone for ${fullName} — skipped`);
      skipped++;
      continue;
    }
    usedPhones.add(phone);

    const email = await generateUniqueEmail(firstName, lastName, usedEmails);
    if (!email) {
      console.warn(`  ⚠️  [${num}] Could not get unique email for ${fullName} — skipped`);
      skipped++;
      continue;
    }
    usedEmails.add(email);

    const dob         = randomDate(1970, 1995);
    const dateOfHire  = randomDate(2015, 2024);
    const district    = randomFrom(UGANDAN_DISTRICTS);
    const basicSalary = (SALARY_BY_ROLE[template.roleCode] ?? 800_000)
                      + Math.floor(Math.random() * 5) * 50_000;

    try {
      const staffId = await generateStaffId(schoolId);

      await db.$transaction(async (tx) => {
        // 1. User
        const user = await tx.user.create({
          data: {
            name:      fullName,
            firstName,
            lastName,
            phone,
            email,
            password:  hashedPassword,
            // FIX [1]: Use UserType enum instead of string literal
            userType:  UserType.STAFF,
            loginId:   staffId,
            schoolId,
            status:    true,
            isVerfied: false,
          },
        });

        // 2. Staff
        const staff = await tx.staff.create({
          data: {
            staffId,
            schoolId,
            userId:               user.id,
            firstName,
            lastName,
            gender:               template.gender,
            dob,
            phone,
            email,
            staffType:            template.staffType,
            employmentType:       template.employmentType,
            status:               StaffStatus.ACTIVE,
            dateOfHire,
            basicSalary,
            highestQualification: randomFrom(QUALIFICATIONS),
            institutionAttended:  randomFrom(INSTITUTIONS),
            specialization:       template.staffType === StaffType.TEACHING
                                    ? randomFrom(SPECIALIZATIONS)
                                    : null,
            address:     `${district}, Uganda`,
            nationality: "Ugandan",
          },
        });

        // 3. Teacher record for TEACHING staff
        if (template.staffType === StaffType.TEACHING) {
          const tchNo = staffId.replace(/^STF/, "TCH");

          const [tPhone, tEmail, tStaffNo] = await Promise.all([
            tx.teacher.findUnique({ where: { phone } }),
            tx.teacher.findUnique({ where: { email } }),
            tx.teacher.findUnique({ where: { staffNo: tchNo } }),
          ]);

          if (!tPhone && !tEmail && !tStaffNo) {
            await tx.teacher.create({
              data: {
                userId:               user.id,
                schoolId,
                staffNo:              tchNo,
                // staffId links Teacher → Staff (bidirectional sync FK)
                staffId:              staff.id,
                firstName,
                lastName,
                gender:               template.gender,
                dateOfBirth:          dob,
                phone,
                email,
                nationality:          "Ugandan",
                address:              `${district}, Uganda`,
                dateOfHire,
                // Teacher.employmentType is a plain String field (not an enum)
                employmentType:       template.employmentType as string,
                role:                 "TEACHER",
                // FIX [2,3]: Use TeacherStatus enum instead of string literals
                currentStatus:        TeacherStatus.ACTIVE,
                status:               TeacherStatus.ACTIVE,
                highestQualification: randomFrom(QUALIFICATIONS),
                specialization:       randomFrom(SPECIALIZATIONS),
              },
            });
          }
        }

        // 4. Role assignment
        await tx.staffRole.create({
          data: {
            staffId:               staff.id,
            staffRoleDefinitionId: roleDef.id,
            schoolId,
            isPrimary:    true,
            isActive:     true,
            assignedDate: new Date(),
          },
        });

        // 5. Employment history
        await tx.employmentHistory.create({
          data: {
            staffId:      staff.id,
            schoolId,
            eventType:    "HIRED",
            description:  `${fullName} joined as ${roleDef.name}`,
            effectiveDate: dateOfHire,
            newValue: {
              basicSalary,
              employmentType: template.employmentType,
              role: roleDef.name,
            },
          },
        });
      });

      console.log(
        `  ✓ [${num}] ${fullName.padEnd(32)}` +
        `${roleDef.name.padEnd(22)}` +
        `${template.staffType.padEnd(15)}` +
        `${staffId}`
      );
      created++;
    } catch (error: any) {
      console.error(`  ✗ [${num}] ${fullName} — ${error.message}`);
      skipped++;
    }
  }

  const finalCount = await db.staff.count({ where: { schoolId } });

  console.log(`\n✅ Done — ${created} created, ${skipped} skipped/failed`);
  console.log(`👥 Total staff now: ${finalCount}`);
  console.log(`🔑 Default password: Password@123`);
  console.log(`   Login: staffId (e.g. STF202603001) + Password@123\n`);

  return { created, skipped };
}

// ════════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  const schoolId = process.argv[2];

  if (!schoolId) {
    console.error("\n❌ Usage: npx ts-node prisma/seeds/seed-staff.ts <schoolId>\n");
    process.exit(1);
  }

  try {
    await seedStaff(schoolId);
  } catch (error: any) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();