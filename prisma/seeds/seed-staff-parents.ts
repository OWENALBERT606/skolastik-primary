// prisma/seeds/seed-staff-parents.ts
// Seeds staff and parents only for both schools.
// Usage: npx tsx prisma/seeds/seed-staff-parents.ts

import { PrismaClient, UserType, StaffType, StaffStatus, EmploymentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const SCHOOL_CODES = ["DPS", "DPS2"];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

let phoneSeq = 800_000_000;
const nextPhone = () => `0${++phoneSeq}`;

let staffSeq = 0;

function nextStaffId(code: string, type: "STF" | "TCH"): string {
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${code}${type}${ym}${String(++staffSeq).padStart(2, "0")}`;
}

async function initStaffSeq(schoolCode: string) {
  const prefix = `${schoolCode}STF`;
  const last = await db.staff.findFirst({
    where:   { staffId: { startsWith: prefix } },
    orderBy: { staffId: "desc" },
    select:  { staffId: true },
  });
  if (last) {
    const n = parseInt(last.staffId.slice(-2), 10);
    if (!isNaN(n)) staffSeq = n;
  } else {
    staffSeq = 0;
  }
}

const MALE_FIRST   = ["Robert","John","David","Moses","Peter","Paul","Joseph","Samuel","Daniel","Michael","Emmanuel","Isaac","Joshua","Andrew","George"];
const FEMALE_FIRST = ["Grace","Mary","Sarah","Ruth","Esther","Lydia","Miriam","Deborah","Judith","Naomi","Priscilla","Agnes","Florence","Beatrice","Harriet"];
const LAST_NAMES   = ["Ssebulime","Kato","Mugisha","Tumwine","Byarugaba","Wasswa","Nsubuga","Lubega","Tusiime","Asiimwe","Okello","Atim","Ochieng","Namukasa","Nalwoga"];
const OCCUPATIONS  = ["Teacher","Farmer","Business Person","Civil Servant","Doctor","Nurse","Accountant","Driver","Trader","Engineer"];
const RELATIONSHIPS = ["Father","Mother","Guardian"];
const RELIGIONS    = ["Catholic","Protestant","Muslim","SDA","Pentecostal"];
const QUALIFICATIONS = ["Certificate in Education","Diploma in Education","Bachelor of Education","Bachelor of Arts","Bachelor of Science"];
const SPECIALIZATIONS = ["Mathematics","English","Science","Social Studies","Religious Education","Agriculture","Local Language","General Teaching"];

function randomDob(minAge: number, maxAge: number): Date {
  const year = new Date().getFullYear() - rnd(minAge, maxAge);
  return new Date(year, rnd(0, 11), rnd(1, 28));
}

async function initPhoneSeq() {
  const users = await db.user.findMany({ select: { phone: true }, orderBy: { phone: "desc" }, take: 1 });
  if (users.length) {
    const n = parseInt(users[0].phone.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > phoneSeq) phoneSeq = n;
  }
}

async function main() {
  console.log("\n🚀 Seeding Staff & Parents\n" + "─".repeat(50));

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
    await seedStaff(school, hashedPassword);
    await seedParents(school, hashedPassword);
  }

  console.log("\n" + "─".repeat(50));
  console.log("✅ Done! All logins: Password@123\n");
}

async function seedStaff(school: { id: string; code: string }, hashedPassword: string) {
  await initStaffSeq(school.code);
  const defs = [
    ...Array.from({ length: 10 }, (_, i) => ({ type: StaffType.TEACHING,     i })),
    ...Array.from({ length: 4  }, (_, i) => ({ type: StaffType.NON_TEACHING, i })),
  ];

  let created = 0;
  for (const def of defs) {
    const gender    = def.i % 2 === 0 ? "Male" : "Female";
    const firstName = gender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName  = pick(LAST_NAMES);
    const staffId   = nextStaffId(school.code, "STF");
    const phone     = nextPhone();
    const email     = `staff.${school.code.toLowerCase()}.${staffId.toLowerCase()}@demo.ug`;

    const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) continue;

    const user = await db.user.create({
      data: {
        name: `${firstName} ${lastName}`, firstName, lastName,
        phone, email, password: hashedPassword,
        userType: UserType.STAFF, schoolId: school.id,
        status: true, isVerfied: true,
      },
      select: { id: true },
    });

    const staff = await db.staff.create({
      data: {
        staffId, schoolId: school.id, userId: user.id,
        firstName, lastName, gender,
        dob:            randomDob(25, 55),
        nationality:    "Ugandan",
        phone, email,
        address:        "Kampala, Uganda",
        religion:       pick(RELIGIONS),
        staffType:      def.type,
        employmentType: EmploymentType.PERMANENT,
        status:         StaffStatus.ACTIVE,
        dateOfHire:     new Date("2025-01-15"),
        basicSalary:    def.type === StaffType.TEACHING ? rnd(600000, 1200000) : rnd(400000, 800000),
        highestQualification: pick(QUALIFICATIONS),
        specialization: def.type === StaffType.TEACHING ? pick(SPECIALIZATIONS) : "Administration",
      },
      select: { id: true },
    });

    // Auto-create Teacher record for teaching staff
    if (def.type === StaffType.TEACHING) {
      const tchNo = staffId.replace(`${school.code}STF`, `${school.code}TCH`);
      await db.teacher.create({
        data: {
          staffNo:         tchNo,
          firstName,       lastName,
          gender,
          dateOfBirth:     randomDob(25, 55),
          nationality:     "Ugandan",
          phone,           email,
          address:         "Kampala, Uganda",
          qualification:   pick(QUALIFICATIONS),
          specialization:  pick(SPECIALIZATIONS),
          teachingLevel:   "Primary",
          dateOfHire:      new Date("2025-01-15"),
          employmentType:  "PERMANENT",
          role:            "Class Teacher",
          schoolId:        school.id,
          userId:          user.id,
          staffId:         staff.id,   // FK to Staff.id (cuid)
        },
      });
    }
    created++;
  }

  console.log(`  ✓ ${created} staff (10 teaching + 4 non-teaching)`);
}

async function seedParents(school: { id: string; code: string }, hashedPassword: string) {
  let created = 0;

  for (let i = 0; i < 20; i++) {
    const gender    = i % 2 === 0 ? "Male" : "Female";
    const firstName = gender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const lastName  = pick(LAST_NAMES);
    const email     = `parent.${school.code.toLowerCase()}.${String(i + 1).padStart(2, "0")}@demo.ug`;

    const exists = await db.parent.findFirst({ where: { email }, select: { id: true } });
    if (exists) continue;

    const phone = nextPhone();

    const user = await db.user.create({
      data: {
        name: `${firstName} ${lastName}`, firstName, lastName,
        phone, email, password: hashedPassword,
        userType: UserType.PARENT, schoolId: school.id,
        status: true, isVerfied: true,
      },
      select: { id: true },
    });

    await db.parent.create({
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
    });
    created++;
  }

  console.log(`  ✓ ${created} parents`);
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
