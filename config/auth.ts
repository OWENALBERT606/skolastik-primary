// config/auth.ts

import type { NextAuthOptions } from "next-auth/index";
import { PrismaAdapter }        from "@next-auth/prisma-adapter";
import type { Adapter }         from "next-auth/adapters";
import CredentialsProvider      from "next-auth/providers/credentials";
import { compare, hash }        from "bcryptjs";
import { db }                   from "@/prisma/db";
import { buildCapabilities }    from "@/lib/utils/capabilities";

// Legacy fallback only — new students use their admission number (set at creation)
const STUDENT_LEGACY_FALLBACK_PASSWORD = "Password@123";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  secret:  process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Staff ID", type: "text" },
        password:   { label: "Password",          type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const id      = credentials.identifier.trim();
        const idUpper = id.toUpperCase();
        let userId: string | null = null;
        let passwordHash: string | null = null;
        let userData: any = null;
        let loginAs: "teacher" | "staff" | "admin" | "student" | "parent" = "teacher";

        // ── Account-lock helper (called after user is resolved) ────────────
        async function checkAndHandleLock(uid: string): Promise<boolean> {
          const u = await db.user.findUnique({
            where:  { id: uid },
            select: { failedLoginAttempts: true, lockedUntil: true },
          });
          if (!u) return false;
          if (u.lockedUntil && u.lockedUntil > new Date()) return false; // locked
          return true; // ok to proceed
        }
        async function recordFailedAttempt(uid: string) {
          const u = await db.user.findUnique({
            where:  { id: uid },
            select: { failedLoginAttempts: true },
          });
          const attempts = (u?.failedLoginAttempts ?? 0) + 1;
          const lockUntil = attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000) // 15-min lockout after 5 failures
            : null;
          await db.user.update({
            where: { id: uid },
            data:  { failedLoginAttempts: attempts, ...(lockUntil ? { lockedUntil: lockUntil } : {}) },
          });
        }
        async function clearFailedAttempts(uid: string) {
          await db.user.update({
            where: { id: uid },
            data:  { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
          });
        }

        if (id.includes("@")) {
          // ── Email login (admins, school admins, parents) ─────────────────
          const user = await db.user.findUnique({
            where:   { email: id },
            include: { roles: true },
          });
          if (!user) return null;
          userId       = user.id;
          passwordHash = user.password;
          userData     = user;

          // Check if this user is a parent — if so, route to parent portal
          const isParent = await db.parent.findUnique({
            where:  { userId: user.id },
            select: { id: true },
          });
          loginAs = isParent ? "parent" : "admin";

        } else if (idUpper.startsWith("TCH")) {
          // ── Teacher ID login → always teacher portal ──────────────────────
          const teacher = await db.teacher.findFirst({
            where:   { staffNo: id, status: "ACTIVE" },
            include: { user: { include: { roles: true } } },
          });
          if (!teacher?.user) return null;
          userId       = teacher.user.id;
          passwordHash = teacher.user.password;
          userData     = teacher.user;
          loginAs      = "teacher";

        } else if (idUpper.startsWith("STF")) {
          // ── Staff ID login → staff portal (DOS / Head Teacher / etc.) ─────
          const staff = await db.staff.findFirst({
            where:   { staffId: id, status: "ACTIVE" },
            include: { user: { include: { roles: true } } },
          });
          if (!staff?.user) return null;
          userId       = staff.user.id;
          passwordHash = staff.user.password;
          userData     = staff.user;
          loginAs      = "staff";

        } else {
          // ── Fallback: try student (admissionNo / LIN) ─────────────────────
          const student = await db.student.findFirst({
            where: {
              OR: [{ admissionNo: id }, { linNumber: id }],
              isActive: true,
            },
            select: {
              id:        true,
              firstName: true,
              lastName:  true,
              admissionNo: true,
              schoolId:  true,
              userId:    true,
            },
          });
          if (!student) return null;

          let studentUser: any;

          if (student.userId) {
            studentUser = await db.user.findUnique({
              where:   { id: student.userId },
              include: { roles: true },
            });
          }

          // Legacy fallback: if no user account exists (pre-system students), provision on first login
          if (!studentUser) {
            // Accept either the legacy fallback or the admission number as default
            const isLegacyPassword = credentials.password === STUDENT_LEGACY_FALLBACK_PASSWORD
              || credentials.password === student.admissionNo;
            if (!isLegacyPassword) return null;

            const defaultHash = await hash(credentials.password, 12);
            const email = `${student.admissionNo.toLowerCase()}@student.somalite.local`;
            const syntheticPhone = `STU-${student.admissionNo}-${Date.now()}`.slice(0, 30);

            studentUser = await db.user.create({
              data: {
                name:      `${student.firstName} ${student.lastName}`,
                firstName: student.firstName,
                lastName:  student.lastName,
                phone:     syntheticPhone,
                email,
                password:  defaultHash,
                loginId:   student.admissionNo,
                userType:  "STUDENT",
              },
              include: { roles: true },
            });

            await db.student.update({
              where: { id: student.id },
              data:  { userId: studentUser.id },
            });
          } else if (!studentUser.password) {
            // Account exists but password was never set — use admission number
            const defaultHash = await hash(student.admissionNo, 12);
            await db.user.update({
              where: { id: studentUser.id },
              data:  { password: defaultHash },
            });
            studentUser.password = defaultHash;
          }

          userId       = studentUser.id;
          passwordHash = studentUser.password;
          userData     = studentUser;
          loginAs      = "student";
        }

        if (!passwordHash || !userId) return null;

        // Check account lock before expensive bcrypt compare
        const unlocked = await checkAndHandleLock(userId);
        if (!unlocked) return null;

        const ok = await compare(credentials.password, passwordHash);
        if (!ok) {
          await recordFailedAttempt(userId);
          return null;
        }
        await clearFailedAttempts(userId);

        return {
          id:          userId!,
          name:        userData.name,
          email:       userData.email,
          image:       userData.image,
          firstName:   userData.firstName,
          lastName:    userData.lastName,
          phone:       userData.phone,
          roles:       userData.roles,
          permissions: [...new Set(userData.roles.flatMap((r: any) => r.permissions))] as string[],
          loginAs,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in — build full capability set
        const caps = await buildCapabilities(user.id);
        token.id           = user.id;
        token.firstName    = (user as any).firstName;
        token.lastName     = (user as any).lastName;
        token.phone        = (user as any).phone;
        token.capabilities = caps;
        token.school       = caps.school;
        token.loginAs      = (user as any).loginAs ?? "teacher";
        // Keep legacy roles array for any code still reading it
        token.roles        = (user as any).roles ?? [];
        token.permissions  = (user as any).permissions ?? [];
      } else if (token.id && !token.loginAs) {
        // Stale JWT (created before loginAs was added) — re-derive from DB
        try {
          const userId = token.id as string;
          const dbUser = await db.user.findUnique({
            where:  { id: userId },
            select: { loginId: true },
          });
          const lid = dbUser?.loginId?.toUpperCase() ?? "";
          if (lid.startsWith("STF")) {
            token.loginAs = "staff";
          } else if (lid.startsWith("TCH")) {
            token.loginAs = "teacher";
          } else if (dbUser?.loginId?.includes("@")) {
            token.loginAs = "admin";
          } else {
            // Check if linked to a Student record → student login
            const linkedStudent = await db.student.findFirst({
              where: { userId: token.id as string },
              select: { id: true },
            });
            if (linkedStudent) {
              token.loginAs = "student";
            } else {
              // Check if linked to a Parent record
              const linkedParent = await db.parent.findUnique({
                where:  { userId: token.id as string },
                select: { id: true },
              });
              token.loginAs = linkedParent ? "parent" : "teacher";
            }
          }
        } catch {
          token.loginAs = "teacher";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const u        = session.user as any;
        u.id           = token.id;
        u.firstName    = token.firstName;
        u.lastName     = token.lastName;
        u.phone        = token.phone;
        u.capabilities = token.capabilities;
        u.school       = token.school;
        u.loginAs      = token.loginAs;
        u.roles        = token.roles;
        u.permissions  = token.permissions;
      }
      return session;
    },
  },
};
