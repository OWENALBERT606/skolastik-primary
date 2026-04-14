// prisma/seeds/seed-parents.ts
//
// Creates 20 realistic Ugandan parents with user accounts for a given school.
// Safe to run even when parents already exist — all uniqueness checks
// are done against the live DB before creating anything.
//
// Usage:
//   npx ts-node prisma/seeds/seed-parents.ts <schoolId>
//
// Example:
//   npx ts-node prisma/seeds/seed-parents.ts cmmdf3jyr0004tx00t375ccc0

import { PrismaClient } from "@prisma/client";
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

// Returns a phone not already in Parent or User tables
async function generateUniquePhone(usedInRun: Set<string>): Promise<string | null> {
  const prefixes = ["0701", "0702", "0703", "0704", "0705", "0772", "0782", "0752", "0756", "0753"];

  for (let attempt = 0; attempt < 30; attempt++) {
    const phone = `${randomFrom(prefixes)}${String(Math.floor(100000 + Math.random() * 900000))}`;
    if (usedInRun.has(phone)) continue;

    const [pConflict, uConflict] = await Promise.all([
      db.parent.findUnique({ where: { phone } }),
      db.user.findFirst({ where: { phone } }),
    ]);

    if (!pConflict && !uConflict) return phone;
  }
  return null;
}

// Returns an email not already in Parent or User tables
async function generateUniqueEmail(
  firstName: string,
  lastName: string,
  usedInRun: Set<string>
): Promise<string | null> {
  const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

  for (let suffix = 1; suffix <= 50; suffix++) {
    const email = suffix === 1
      ? `${base}@gmail.com`
      : `${base}${suffix}@gmail.com`;

    if (usedInRun.has(email)) continue;

    const [pConflict, uConflict] = await Promise.all([
      db.parent.findFirst({ where: { email } }),
      db.user.findFirst({ where: { email } }),
    ]);

    if (!pConflict && !uConflict) return email;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// UGANDAN PARENT DATA
// ════════════════════════════════════════════════════════════════════════════

const FIRST_NAMES_MALE = [
  "Ssekandi", "Mugisha", "Okello", "Tumwesigye", "Byamugisha",
  "Kizza", "Musoke", "Ssemanda", "Lubega", "Waiswa",
  "Ochieng", "Opolot", "Muwanguzi", "Tendo", "Kato",
  "Waswa", "Kabugo", "Mulindwa", "Ssali", "Bwambale",
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

const OCCUPATIONS = [
  "Teacher",
  "Business Person",
  "Civil Servant",
  "Farmer",
  "Driver",
  "Nurse",
  "Accountant",
  "Engineer",
  "Mechanic",
  "Trader",
  "Doctor",
  "Police Officer",
  "Pastor",
  "Tailor",
  "Carpenter",
];

const UGANDAN_DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Mbarara",
  "Gulu", "Lira", "Fort Portal", "Mbale", "Soroti",
  "Masaka", "Entebbe", "Kabale", "Arua", "Tororo",
];

const RELIGIONS = ["Catholic", "Protestant", "Muslim", "Pentecostal", "Seventh Day Adventist"];

// 20 parent templates
const PARENT_TEMPLATES: {
  gender: "Male" | "Female";
  title: string;
  relationship: string;
}[] = [
  // Fathers (10)
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Father"     },
  { gender: "Male",   title: "Dr",  relationship: "Father"     },
  { gender: "Male",   title: "Mr",  relationship: "Guardian"   },
  { gender: "Male",   title: "Mr",  relationship: "Uncle"      },
  // Mothers (8)
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  { gender: "Female", title: "Ms",  relationship: "Mother"     },
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  { gender: "Female", title: "Mrs", relationship: "Mother"     },
  // Other guardians (2)
  { gender: "Female", title: "Ms",  relationship: "Guardian"   },
  { gender: "Female", title: "Mrs", relationship: "Aunt"       },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

export async function seedParents(schoolId: string) {
  console.log(`\n🌱 Seeding 20 parents for school: ${schoolId}\n`);

  // Verify school exists
  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { id: true, name: true },
  });

  if (!school) throw new Error(`School not found: ${schoolId}`);

  console.log(`🏫 School: ${school.name}`);

  const existingCount = await db.parent.count({ where: { schoolId } });
  console.log(`👨‍👩‍👧 Existing parents: ${existingCount}\n`);

  // Ensure the parent role exists
  const parentRole = await db.role.upsert({
    where:  { roleName: "parent" },
    create: {
      roleName:    "parent",
      displayName: "Parent",
      description: "Parent/Guardian — can view their children's academic information",
      permissions: ["view_own_children", "view_reports", "view_attendance"],
    },
    update: {},
  });

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  const usedPhones = new Set<string>();
  const usedEmails = new Set<string>();

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < PARENT_TEMPLATES.length; i++) {
    const template = PARENT_TEMPLATES[i];
    const num      = String(i + 1).padStart(2, "0");

    // Names
    const namePool  = template.gender === "Male" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    const firstName = randomFrom(namePool);
    const lastName  = randomFrom(LAST_NAMES);
    const fullName  = `${firstName} ${lastName}`;

    // Phone — unique across DB + this run
    const phone = await generateUniquePhone(usedPhones);
    if (!phone) {
      console.warn(`  ⚠️  [${num}] Could not get unique phone for ${fullName} — skipped`);
      skipped++;
      continue;
    }
    usedPhones.add(phone);

    // Alt phone (optional, different from primary)
    let altNo: string | null = null;
    if (Math.random() > 0.4) {
      const altPrefix = randomFrom(["0701", "0702", "0703", "0772", "0782", "0756"]);
      altNo = `${altPrefix}${String(Math.floor(100000 + Math.random() * 900000))}`;
      // Don't need to check DB uniqueness for altNo — it's not a unique field
    }

    // Email — unique across DB + this run
    const email = await generateUniqueEmail(firstName, lastName, usedEmails);
    if (!email) {
      console.warn(`  ⚠️  [${num}] Could not get unique email for ${fullName} — skipped`);
      skipped++;
      continue;
    }
    usedEmails.add(email);

    const dob      = randomDate(1970, 1990);
    const district = randomFrom(UGANDAN_DISTRICTS);
    const religion = randomFrom(RELIGIONS);
    const occupation = randomFrom(OCCUPATIONS);

    try {
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
            userType:  "PARENT",
            loginId:   null,           // parents log in with email + password
            schoolId,
            status:    true,
            isVerfied: false,
            roles:     { connect: [{ id: parentRole.id }] },
          },
        });

        // 2. Parent
        await tx.parent.create({
          data: {
            userId:       user.id,
            schoolId,
            firstName,
            lastName,
            name:         fullName,
            phone,
            email,
            altNo,
            title:        template.title,
            relationship: template.relationship,
            gender:       template.gender,
            dob,
            occupation,
            religion,
            address:      `${district}, Uganda`,
            country:      "Uganda",
          },
        });
      });

      console.log(
        `  ✓ [${num}] ${fullName.padEnd(32)}` +
        `${template.title.padEnd(6)}` +
        `${template.relationship.padEnd(12)}` +
        `${phone}`
      );
      created++;
    } catch (error: any) {
      console.error(`  ✗ [${num}] ${fullName} — ${error.message}`);
      skipped++;
    }
  }

  const finalCount = await db.parent.count({ where: { schoolId } });

  console.log(`\n✅ Done — ${created} created, ${skipped} skipped/failed`);
  console.log(`👨‍👩‍👧 Total parents now: ${finalCount}`);
  console.log(`🔑 Default password: Password@123`);
  console.log(`   Login: email (e.g. nakato.ssebulime@gmail.com) + Password@123\n`);

  return { created, skipped };
}

// ════════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  const schoolId = process.argv[2];

  if (!schoolId) {
    console.error("\n❌ Usage: npx ts-node prisma/seeds/seed-parents.ts <schoolId>\n");
    process.exit(1);
  }

  try {
    await seedParents(schoolId);
  } catch (error: any) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();