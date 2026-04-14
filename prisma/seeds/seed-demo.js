"use strict";
// prisma/seeds/seed-demo.ts
//
// Full demo seed — runs every step in dependency order:
//
//   1.  Role         — "School Admin" Role record
//   2.  Users        — school admin User accounts (one per school)
//   3.  Schools      — School records linked to their admin users
//   4.  Academic yr  — one active AcademicYear per school
//   5.  Terms        — Term 1, 2, 3 per academic year
//   6.  Class templates — S1–S6 (O-Level + A-Level) per school
//   7.  Class years  — ClassYear instances for active year
//   8.  Streams      — 2 streams per class (North, South)
//   9.  Parents      — 10 parents per school with User accounts
//  10.  Students     — 4 per stream, linked to parents + enrolled
//                      into the active term and auto-enrolled in
//                      all compulsory stream subjects
//
// Safe to call multiple times — uses upsert/findFirst guards.
//
// Usage:
//   npx ts-node prisma/seeds/seed-demo.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var client_2 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var db = new client_1.PrismaClient();
// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════
function slug(name) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomDate(startYear, endYear) {
    var s = new Date(startYear, 0, 1).getTime();
    var e = new Date(endYear, 11, 31).getTime();
    return new Date(s + Math.random() * (e - s));
}
// Phone guaranteed unique across the run (simple counter approach)
var phoneSeq = 700000000;
function nextPhone() {
    phoneSeq++;
    return "0".concat(phoneSeq);
}
// Admission number: ADM{YEAR}{SEQ:04}
var admSeq = 0;
function nextAdmNo() {
    admSeq++;
    return "ADM".concat(new Date().getFullYear()).concat(String(admSeq).padStart(4, "0"));
}
// ════════════════════════════════════════════════════════════════════════════
// STATIC DATA
// ════════════════════════════════════════════════════════════════════════════
var SCHOOL_ADMIN_PERMISSIONS = [
    "dashboard.read", "dashboard.update",
    "users.create", "users.read", "users.update", "users.delete",
    "students.create", "students.read", "students.update", "students.delete",
    "teachers.create", "teachers.read", "teachers.update", "teachers.delete",
    "staff.create", "staff.read", "staff.update", "staff.delete",
    "parents.create", "parents.read", "parents.update", "parents.delete",
    "reports.create", "reports.read", "reports.update", "reports.delete",
    "settings.create", "settings.read", "settings.update", "settings.delete",
    "fees.create", "fees.read", "fees.update", "fees.delete",
    "payroll.create", "payroll.read", "payroll.update", "payroll.delete",
];
// ── Two demo schools ────────────────────────────────────────────────────────
var SCHOOLS = [
    {
        name: "St. Mary's College Kisubi",
        motto: "Ora et Labora",
        code: "SMCK",
        address: "Kisubi, Wakiso District",
        contact: "0414-200100",
        email: "info@smck.ac.ug",
        division: client_2.SchoolDivision.BOTH,
        admin: {
            firstName: "Bernard",
            lastName: "Kiggundu",
            email: "admin@smck.ac.ug",
        },
    },
    {
        name: "Gayaza High School",
        motto: "Light and Truth",
        code: "GHS",
        address: "Gayaza, Wakiso District",
        contact: "0414-273453",
        email: "info@gayaza.ac.ug",
        division: client_2.SchoolDivision.BOTH,
        admin: {
            firstName: "Agnes",
            lastName: "Namugga",
            email: "admin@gayaza.ac.ug",
        },
    },
];
// ── Class definitions ───────────────────────────────────────────────────────
// level = ordering integer (P1=1 … P7=7)
var CLASS_TEMPLATES = [
    { name: "Primary 1", code: "P1", level: 1, description: "Primary One" },
    { name: "Primary 2", code: "P2", level: 2, description: "Primary Two" },
    { name: "Primary 3", code: "P3", level: 3, description: "Primary Three" },
    { name: "Primary 4", code: "P4", level: 4, description: "Primary Four" },
    { name: "Primary 5", code: "P5", level: 5, description: "Primary Five" },
    { name: "Primary 6", code: "P6", level: 6, description: "Primary Six" },
    { name: "Primary 7", code: "P7", level: 7, description: "Primary Seven — PLE candidates" },
];
// Two streams per class
var STREAM_NAMES = ["North", "South"];
// ── Ugandan names ───────────────────────────────────────────────────────────
var MALE_FIRST = ["Ssekandi", "Mugisha", "Okello", "Tumwesigye", "Kizza", "Musoke", "Waiswa", "Ochieng", "Tendo", "Kato", "Waswa", "Mulindwa", "Ssali", "Lubega", "Kabugo"];
var FEMALE_FIRST = ["Nakato", "Namukasa", "Nalwoga", "Akello", "Auma", "Nansubuga", "Nabirye", "Namusoke", "Atuhaire", "Nankya", "Nassazi", "Birungi", "Nabbosa", "Nabwire", "Tumusiime"];
var LAST_NAMES = ["Ssebulime", "Kato", "Mugisha", "Tumwine", "Byarugaba", "Okwir", "Atim", "Wasswa", "Nsubuga", "Ssekitoleko", "Lubega", "Tusiime", "Namanya", "Asiimwe", "Ntambi"];
var OCCUPATIONS = ["Teacher", "Farmer", "Business Person", "Civil Servant", "Doctor", "Engineer", "Nurse", "Accountant", "Driver", "Trader"];
var RELATIONSHIPS = ["Father", "Mother", "Guardian"];
// ════════════════════════════════════════════════════════════════════════════
// STEP 1 — SCHOOL ADMIN ROLE
// ════════════════════════════════════════════════════════════════════════════
function seedSchoolAdminRole() {
    return __awaiter(this, void 0, void 0, function () {
        var existing, role;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n📋 Step 1 — School admin role...");
                    return [4 /*yield*/, db.role.findFirst({
                            where: { roleName: "school_admin" },
                        })];
                case 1:
                    existing = _a.sent();
                    if (existing) {
                        console.log("   ↻  Role 'school_admin' already exists — skipped");
                        return [2 /*return*/, existing];
                    }
                    return [4 /*yield*/, db.role.create({
                            data: {
                                displayName: "School Admin",
                                roleName: "school_admin",
                                description: "Full access to a single school's dashboard and data",
                                permissions: SCHOOL_ADMIN_PERMISSIONS,
                            },
                        })];
                case 2:
                    role = _a.sent();
                    console.log("   \u2713  Role created: ".concat(role.displayName, " (").concat(role.id, ")"));
                    return [2 /*return*/, role];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 2 — ADMIN USERS
// ════════════════════════════════════════════════════════════════════════════
function seedAdminUsers(schoolAdminRole, hashedPassword) {
    return __awaiter(this, void 0, void 0, function () {
        var users, _i, SCHOOLS_1, school, admin, existing, phone, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n👤 Step 2 — Admin users...");
                    users = {};
                    _i = 0, SCHOOLS_1 = SCHOOLS;
                    _a.label = 1;
                case 1:
                    if (!(_i < SCHOOLS_1.length)) return [3 /*break*/, 5];
                    school = SCHOOLS_1[_i];
                    admin = school.admin;
                    return [4 /*yield*/, db.user.findUnique({
                            where: { email: admin.email },
                        })];
                case 2:
                    existing = _a.sent();
                    if (existing) {
                        console.log("   \u21BB  User ".concat(admin.email, " already exists \u2014 skipped"));
                        users[school.code] = { id: existing.id, email: admin.email };
                        return [3 /*break*/, 4];
                    }
                    phone = nextPhone();
                    return [4 /*yield*/, db.user.create({
                            data: {
                                name: "".concat(admin.firstName, " ").concat(admin.lastName),
                                firstName: admin.firstName,
                                lastName: admin.lastName,
                                phone: phone,
                                email: admin.email,
                                password: hashedPassword,
                                userType: client_2.UserType.SCHOOL_ADMIN,
                                status: true,
                                isVerfied: true,
                                roles: { connect: { id: schoolAdminRole.id } },
                            },
                        })];
                case 3:
                    user = _a.sent();
                    console.log("   \u2713  ".concat(admin.firstName, " ").concat(admin.lastName, " \u2014 ").concat(admin.email));
                    users[school.code] = { id: user.id, email: admin.email };
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/, users];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 3 — SCHOOLS
// ════════════════════════════════════════════════════════════════════════════
function seedSchools(adminUsers) {
    return __awaiter(this, void 0, void 0, function () {
        var schools, _i, SCHOOLS_2, def, existing, adminUser, school;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n🏫 Step 3 — Schools...");
                    schools = {};
                    _i = 0, SCHOOLS_2 = SCHOOLS;
                    _a.label = 1;
                case 1:
                    if (!(_i < SCHOOLS_2.length)) return [3 /*break*/, 6];
                    def = SCHOOLS_2[_i];
                    return [4 /*yield*/, db.school.findUnique({
                            where: { code: def.code },
                        })];
                case 2:
                    existing = _a.sent();
                    if (existing) {
                        console.log("   \u21BB  ".concat(def.name, " already exists \u2014 skipped"));
                        schools[def.code] = { id: existing.id, name: existing.name };
                        return [3 /*break*/, 5];
                    }
                    adminUser = adminUsers[def.code];
                    return [4 /*yield*/, db.school.create({
                            data: {
                                name: def.name,
                                motto: def.motto,
                                slug: slug(def.name),
                                code: def.code,
                                address: def.address,
                                contact: def.contact,
                                email: def.email,
                                isActive: true,
                                adminId: adminUser.id,
                                // Also add the admin user to the school's users relation
                                users: { connect: { id: adminUser.id } },
                            },
                        })];
                case 3:
                    school = _a.sent();
                    // Back-fill schoolId on the admin user (for login routing)
                    return [4 /*yield*/, db.user.update({
                            where: { id: adminUser.id },
                            data: { schoolId: school.id },
                        })];
                case 4:
                    // Back-fill schoolId on the admin user (for login routing)
                    _a.sent();
                    console.log("   \u2713  ".concat(school.name, " (").concat(school.code, ") \u2014 admin: ").concat(def.admin.email));
                    schools[def.code] = { id: school.id, name: school.name };
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, schools];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 4 — ACADEMIC YEAR
// ════════════════════════════════════════════════════════════════════════════
function seedAcademicYears(schools) {
    return __awaiter(this, void 0, void 0, function () {
        var year, yearMap, _i, _a, _b, code, school, existing, academicYear;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n📅 Step 4 — Academic years...");
                    year = String(new Date().getFullYear());
                    yearMap = {};
                    _i = 0, _a = Object.entries(schools);
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    _b = _a[_i], code = _b[0], school = _b[1];
                    return [4 /*yield*/, db.academicYear.findUnique({
                            where: { year_schoolId: { year: year, schoolId: school.id } },
                        })];
                case 2:
                    existing = _c.sent();
                    if (existing) {
                        console.log("   \u21BB  ".concat(code, " ").concat(year, " already exists \u2014 skipped"));
                        yearMap[code] = { id: existing.id };
                        return [3 /*break*/, 4];
                    }
                    return [4 /*yield*/, db.academicYear.create({
                            data: {
                                year: year,
                                schoolId: school.id,
                                isActive: true,
                                startDate: new Date("".concat(year, "-02-01")),
                                endDate: new Date("".concat(year, "-12-10")),
                            },
                        })];
                case 3:
                    academicYear = _c.sent();
                    console.log("   \u2713  ".concat(code, " \u2014 ").concat(year));
                    yearMap[code] = { id: academicYear.id };
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/, yearMap];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 5 — ACADEMIC TERMS
// ════════════════════════════════════════════════════════════════════════════
var TERM_DEFS = [
    { termNumber: 1, name: "Term 1", startDate: "02-01", endDate: "05-10" },
    { termNumber: 2, name: "Term 2", startDate: "05-27", endDate: "08-15" },
    { termNumber: 3, name: "Term 3", startDate: "09-01", endDate: "12-05" },
];
function seedAcademicTerms(academicYears) {
    return __awaiter(this, void 0, void 0, function () {
        var year, termMap, _i, _a, _b, code, academicYear, _c, TERM_DEFS_1, def, existing, term;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("\n📆 Step 5 — Academic terms...");
                    year = String(new Date().getFullYear());
                    termMap = {};
                    _i = 0, _a = Object.entries(academicYears);
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    _b = _a[_i], code = _b[0], academicYear = _b[1];
                    termMap[code] = [];
                    _c = 0, TERM_DEFS_1 = TERM_DEFS;
                    _d.label = 2;
                case 2:
                    if (!(_c < TERM_DEFS_1.length)) return [3 /*break*/, 6];
                    def = TERM_DEFS_1[_c];
                    return [4 /*yield*/, db.academicTerm.findUnique({
                            where: {
                                termNumber_academicYearId: {
                                    termNumber: def.termNumber,
                                    academicYearId: academicYear.id,
                                },
                            },
                        })];
                case 3:
                    existing = _d.sent();
                    if (existing) {
                        termMap[code].push({ id: existing.id });
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, db.academicTerm.create({
                            data: {
                                name: def.name,
                                termNumber: def.termNumber,
                                academicYearId: academicYear.id,
                                startDate: new Date("".concat(year, "-").concat(def.startDate)),
                                endDate: new Date("".concat(year, "-").concat(def.endDate)),
                                // Term 1 is active at seed time
                                isActive: def.termNumber === 1,
                            },
                        })];
                case 4:
                    term = _d.sent();
                    termMap[code].push({ id: term.id });
                    _d.label = 5;
                case 5:
                    _c++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log("   \u2713  ".concat(code, " \u2014 3 terms seeded"));
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, termMap];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 6 — CLASS TEMPLATES
// ════════════════════════════════════════════════════════════════════════════
function seedClassTemplates(schools) {
    return __awaiter(this, void 0, void 0, function () {
        var templateMap, _i, _a, _b, code, school, _c, CLASS_TEMPLATES_1, def, existing, template;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("\n📚 Step 6 — Class templates...");
                    templateMap = {};
                    _i = 0, _a = Object.entries(schools);
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    _b = _a[_i], code = _b[0], school = _b[1];
                    templateMap[code] = {};
                    _c = 0, CLASS_TEMPLATES_1 = CLASS_TEMPLATES;
                    _d.label = 2;
                case 2:
                    if (!(_c < CLASS_TEMPLATES_1.length)) return [3 /*break*/, 6];
                    def = CLASS_TEMPLATES_1[_c];
                    return [4 /*yield*/, db.classTemplate.findFirst({
                            where: { schoolId: school.id, name: def.name },
                            select: { id: true },
                        })];
                case 3:
                    existing = _d.sent();
                    if (existing) {
                        templateMap[code][def.code] = existing.id;
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, db.classTemplate.create({
                            data: {
                                name: def.name,
                                code: def.code,
                                description: def.description,
                                level: def.level,
                                schoolId: school.id,
                            },
                        })];
                case 4:
                    template = _d.sent();
                    templateMap[code][def.code] = template.id;
                    _d.label = 5;
                case 5:
                    _c++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log("   \u2713  ".concat(code, " \u2014 6 class templates (S1\u2013S6)"));
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, templateMap];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 7 — CLASS YEARS
// ════════════════════════════════════════════════════════════════════════════
function seedClassYears(templateMap, academicYears) {
    return __awaiter(this, void 0, void 0, function () {
        var classYearMap, _i, _a, _b, code, templates, academicYear, _c, CLASS_TEMPLATES_2, def, templateId, existing, classYear;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("\n🎓 Step 7 — Class years...");
                    classYearMap = {};
                    _i = 0, _a = Object.entries(templateMap);
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    _b = _a[_i], code = _b[0], templates = _b[1];
                    classYearMap[code] = {};
                    academicYear = academicYears[code];
                    _c = 0, CLASS_TEMPLATES_2 = CLASS_TEMPLATES;
                    _d.label = 2;
                case 2:
                    if (!(_c < CLASS_TEMPLATES_2.length)) return [3 /*break*/, 6];
                    def = CLASS_TEMPLATES_2[_c];
                    templateId = templates[def.code];
                    return [4 /*yield*/, db.classYear.findUnique({
                            where: {
                                classTemplateId_academicYearId: {
                                    classTemplateId: templateId,
                                    academicYearId: academicYear.id,
                                },
                            },
                            select: { id: true },
                        })];
                case 3:
                    existing = _d.sent();
                    if (existing) {
                        classYearMap[code][def.code] = { id: existing.id };
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, db.classYear.create({
                            data: {
                                classTemplateId: templateId,
                                academicYearId: academicYear.id,
                                isActive: true,
                                maxStudents: 80,
                            },
                        })];
                case 4:
                    classYear = _d.sent();
                    classYearMap[code][def.code] = { id: classYear.id };
                    _d.label = 5;
                case 5:
                    _c++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log("   \u2713  ".concat(code, " \u2014 6 class years"));
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, classYearMap];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 8 — STREAMS
// ════════════════════════════════════════════════════════════════════════════
function seedStreams(classYearMap, schools) {
    return __awaiter(this, void 0, void 0, function () {
        var streamMap, _i, _a, _b, code, classYears, school, _c, _d, _e, classCode, classYear, _f, STREAM_NAMES_1, streamName, existing, stream;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log("\n🔀 Step 8 — Streams...");
                    streamMap = {};
                    _i = 0, _a = Object.entries(classYearMap);
                    _g.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 10];
                    _b = _a[_i], code = _b[0], classYears = _b[1];
                    streamMap[code] = {};
                    school = schools[code];
                    _c = 0, _d = Object.entries(classYears);
                    _g.label = 2;
                case 2:
                    if (!(_c < _d.length)) return [3 /*break*/, 8];
                    _e = _d[_c], classCode = _e[0], classYear = _e[1];
                    streamMap[code][classCode] = [];
                    _f = 0, STREAM_NAMES_1 = STREAM_NAMES;
                    _g.label = 3;
                case 3:
                    if (!(_f < STREAM_NAMES_1.length)) return [3 /*break*/, 7];
                    streamName = STREAM_NAMES_1[_f];
                    return [4 /*yield*/, db.stream.findUnique({
                            where: { classYearId_name: { classYearId: classYear.id, name: streamName } },
                            select: { id: true, name: true },
                        })];
                case 4:
                    existing = _g.sent();
                    if (existing) {
                        streamMap[code][classCode].push({ id: existing.id, name: existing.name });
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, db.stream.create({
                            data: {
                                name: streamName,
                                classYearId: classYear.id,
                                schoolId: school.id,
                            },
                        })];
                case 5:
                    stream = _g.sent();
                    streamMap[code][classCode].push({ id: stream.id, name: stream.name });
                    _g.label = 6;
                case 6:
                    _f++;
                    return [3 /*break*/, 3];
                case 7:
                    _c++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("   \u2713  ".concat(code, " \u2014 2 streams \u00D7 6 classes = 12 streams"));
                    _g.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 1];
                case 10: return [2 /*return*/, streamMap];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 9 — PARENTS
// ════════════════════════════════════════════════════════════════════════════
function seedParents(schools, hashedPassword) {
    return __awaiter(this, void 0, void 0, function () {
        var parentMap, _i, _a, _b, code, school, i, gender, firstName, lastName, fullName, phone, email, existing, user, parent_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n👨‍👩‍👧 Step 9 — Parents...");
                    parentMap = {};
                    _i = 0, _a = Object.entries(schools);
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    _b = _a[_i], code = _b[0], school = _b[1];
                    parentMap[code] = [];
                    i = 0;
                    _c.label = 2;
                case 2:
                    if (!(i < 10)) return [3 /*break*/, 7];
                    gender = i % 2 === 0 ? "Male" : "Female";
                    firstName = gender === "Male" ? randomFrom(MALE_FIRST) : randomFrom(FEMALE_FIRST);
                    lastName = randomFrom(LAST_NAMES);
                    fullName = "".concat(firstName, " ").concat(lastName);
                    phone = nextPhone();
                    email = "parent".concat(code.toLowerCase()).concat(i + 1, "@demo.ug");
                    return [4 /*yield*/, db.parent.findFirst({
                            where: { email: email },
                            select: { id: true },
                        })];
                case 3:
                    existing = _c.sent();
                    if (existing) {
                        parentMap[code].push(existing.id);
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, db.user.create({
                            data: {
                                name: fullName,
                                firstName: firstName,
                                lastName: lastName,
                                phone: phone,
                                email: email,
                                password: hashedPassword,
                                userType: client_2.UserType.PARENT,
                                schoolId: school.id,
                                status: true,
                                isVerfied: true,
                            },
                        })];
                case 4:
                    user = _c.sent();
                    return [4 /*yield*/, db.parent.create({
                            data: {
                                firstName: firstName,
                                lastName: lastName,
                                name: fullName,
                                phone: phone,
                                email: email,
                                gender: gender,
                                relationship: randomFrom(RELATIONSHIPS),
                                occupation: randomFrom(OCCUPATIONS),
                                address: "Kampala, Uganda",
                                userId: user.id,
                                schoolId: school.id,
                            },
                        })];
                case 5:
                    parent_1 = _c.sent();
                    parentMap[code].push(parent_1.id);
                    _c.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 2];
                case 7:
                    console.log("   \u2713  ".concat(code, " \u2014 10 parents"));
                    _c.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, parentMap];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// STEP 10 — STUDENTS  (4 per stream, enrolled + subject-enrolled)
// ════════════════════════════════════════════════════════════════════════════
function seedStudents(schools, classYearMap, streamMap, academicYears, termMap, parentMap) {
    return __awaiter(this, void 0, void 0, function () {
        var totalCreated, _i, _a, _b, code, school, academicYear, activeTerm, parents, parentIndex, _c, _d, _e, classCode, classYear, streams, _f, streams_1, stream, streamSubjects, _loop_1, s, count;
        var _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    console.log("\n🎒 Step 10 — Students...");
                    totalCreated = 0;
                    _i = 0, _a = Object.entries(schools);
                    _h.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 13];
                    _b = _a[_i], code = _b[0], school = _b[1];
                    academicYear = academicYears[code];
                    activeTerm = termMap[code][0];
                    parents = parentMap[code];
                    parentIndex = 0;
                    _c = 0, _d = Object.entries(classYearMap[code]);
                    _h.label = 2;
                case 2:
                    if (!(_c < _d.length)) return [3 /*break*/, 10];
                    _e = _d[_c], classCode = _e[0], classYear = _e[1];
                    streams = (_g = streamMap[code][classCode]) !== null && _g !== void 0 ? _g : [];
                    _f = 0, streams_1 = streams;
                    _h.label = 3;
                case 3:
                    if (!(_f < streams_1.length)) return [3 /*break*/, 9];
                    stream = streams_1[_f];
                    return [4 /*yield*/, db.streamSubject.findMany({
                            where: {
                                streamId: stream.id,
                                termId: activeTerm.id,
                                subjectType: "COMPULSORY",
                                isActive: true,
                            },
                            select: { id: true },
                        })];
                case 4:
                    streamSubjects = _h.sent();
                    _loop_1 = function (s) {
                        var gender, firstName, lastName, fullName, admNo, phone, parentId, existingStudent, user, _j, _k, student, enrollment;
                        var _l, _m;
                        return __generator(this, function (_o) {
                            switch (_o.label) {
                                case 0:
                                    gender = s % 2 === 0 ? "Male" : "Female";
                                    firstName = gender === "Male" ? randomFrom(MALE_FIRST) : randomFrom(FEMALE_FIRST);
                                    lastName = randomFrom(LAST_NAMES);
                                    fullName = "".concat(firstName, " ").concat(lastName);
                                    admNo = nextAdmNo();
                                    phone = nextPhone();
                                    parentId = parents[parentIndex % parents.length];
                                    parentIndex++;
                                    return [4 /*yield*/, db.student.findUnique({
                                            where: { admissionNo_schoolId: { admissionNo: admNo, schoolId: school.id } },
                                        })];
                                case 1:
                                    existingStudent = _o.sent();
                                    if (existingStudent)
                                        return [2 /*return*/, "continue"];
                                    _k = (_j = db.user).create;
                                    _l = {};
                                    _m = {
                                        name: fullName,
                                        firstName: firstName,
                                        lastName: lastName,
                                        phone: phone,
                                        email: null
                                    };
                                    return [4 /*yield*/, bcryptjs_1.default.hash(admNo, 10)];
                                case 2: return [4 /*yield*/, _k.apply(_j, [(_l.data = (_m.password = _o.sent(),
                                            _m.userType = client_2.UserType.STUDENT,
                                            _m.loginId = admNo,
                                            _m.schoolId = school.id,
                                            _m.status = true,
                                            _m.isVerfied = false,
                                            _m),
                                            _l)])];
                                case 3:
                                    user = _o.sent();
                                    return [4 /*yield*/, db.student.create({
                                            data: {
                                                admissionNo: admNo,
                                                firstName: firstName,
                                                lastName: lastName,
                                                dob: randomDate(2005, 2013),
                                                gender: gender,
                                                nationality: "Ugandan",
                                                parentId: parentId,
                                                schoolId: school.id,
                                                userId: user.id,
                                                admissionDate: new Date(),
                                                isActive: true,
                                            },
                                        })];
                                case 4:
                                    student = _o.sent();
                                    return [4 /*yield*/, db.enrollment.create({
                                            data: {
                                                studentId: student.id,
                                                classYearId: classYear.id,
                                                streamId: stream.id,
                                                academicYearId: academicYear.id,
                                                termId: activeTerm.id,
                                                enrollmentType: client_2.EnrollmentType.NEW,
                                                status: client_2.EnrollmentStatus.ACTIVE,
                                            },
                                        })];
                                case 5:
                                    enrollment = _o.sent();
                                    if (!(streamSubjects.length > 0)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, db.studentSubjectEnrollment.createMany({
                                            data: streamSubjects.map(function (ss) { return ({
                                                enrollmentId: enrollment.id,
                                                streamSubjectId: ss.id,
                                                status: client_2.SubjectEnrollmentStatus.ACTIVE,
                                                isCompulsory: true,
                                                isAutoEnrolled: true,
                                            }); }),
                                            skipDuplicates: true,
                                        })];
                                case 6:
                                    _o.sent();
                                    _o.label = 7;
                                case 7:
                                    totalCreated++;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    s = 0;
                    _h.label = 5;
                case 5:
                    if (!(s < 4)) return [3 /*break*/, 8];
                    return [5 /*yield**/, _loop_1(s)];
                case 6:
                    _h.sent();
                    _h.label = 7;
                case 7:
                    s++;
                    return [3 /*break*/, 5];
                case 8:
                    _f++;
                    return [3 /*break*/, 3];
                case 9:
                    _c++;
                    return [3 /*break*/, 2];
                case 10: return [4 /*yield*/, db.student.count({ where: { schoolId: school.id } })];
                case 11:
                    count = _h.sent();
                    console.log("   \u2713  ".concat(code, " \u2014 ").concat(count, " students"));
                    _h.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 1];
                case 13:
                    console.log("   Total new students created: ".concat(totalCreated));
                    return [2 /*return*/];
            }
        });
    });
}
// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, schoolAdminRole, adminUsers, schools, academicYears, termMap, templateMap, classYearMap, streamMap, parentMap, _i, SCHOOLS_3, s;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🚀 Starting full demo seed...");
                    console.log("─".repeat(60));
                    return [4 /*yield*/, bcryptjs_1.default.hash("Password@123", 10)];
                case 1:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, seedSchoolAdminRole()];
                case 2:
                    schoolAdminRole = _a.sent();
                    return [4 /*yield*/, seedAdminUsers(schoolAdminRole, hashedPassword)];
                case 3:
                    adminUsers = _a.sent();
                    return [4 /*yield*/, seedSchools(adminUsers)];
                case 4:
                    schools = _a.sent();
                    return [4 /*yield*/, seedAcademicYears(schools)];
                case 5:
                    academicYears = _a.sent();
                    return [4 /*yield*/, seedAcademicTerms(academicYears)];
                case 6:
                    termMap = _a.sent();
                    return [4 /*yield*/, seedClassTemplates(schools)];
                case 7:
                    templateMap = _a.sent();
                    return [4 /*yield*/, seedClassYears(templateMap, academicYears)];
                case 8:
                    classYearMap = _a.sent();
                    return [4 /*yield*/, seedStreams(classYearMap, schools)];
                case 9:
                    streamMap = _a.sent();
                    return [4 /*yield*/, seedParents(schools, hashedPassword)];
                case 10:
                    parentMap = _a.sent();
                    // 10. Students
                    return [4 /*yield*/, seedStudents(schools, classYearMap, streamMap, academicYears, termMap, parentMap)];
                case 11:
                    // 10. Students
                    _a.sent();
                    console.log("\n" + "─".repeat(60));
                    console.log("✅ Demo seed complete!\n");
                    console.log("School admin logins:");
                    for (_i = 0, SCHOOLS_3 = SCHOOLS; _i < SCHOOLS_3.length; _i++) {
                        s = SCHOOLS_3[_i];
                        console.log("  ".concat(s.admin.email.padEnd(30), "  Password@123"));
                    }
                    console.log("\nStudent logins:");
                    console.log("  loginId = admissionNo (e.g. ADM20250001)");
                    console.log("  password = admissionNo (same value)\n");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
