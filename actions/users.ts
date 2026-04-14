

// "use server";
// import { ResetPasswordEmail } from "@/components/email-templates/reset-password";
// import { db } from "@/prisma/db";
// import { UserProps } from "@/types/types";
// import { revalidatePath } from "next/cache";
// import { PasswordProps } from "@/components/Forms/ChangePasswordForm";
// import { Resend } from "resend";
// import { generateToken } from "@/lib/token";
// import bcrypt, { compare } from "bcryptjs";
// import { UserType } from "@prisma/client";

// const resend = new Resend(process.env.RESEND_API_KEY);
// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// const DEFAULT_USER_ROLE = {
//   displayName: "User",
//   roleName: "user",
//   description: "Default user role with basic permissions",
//   permissions: [
//     "dashboard.read",
//     "profile.read",
//     "profile.update",
//     "orders.read",
//   ],
// };

// export async function createUser(data: UserProps) {
//   const {
//     email,
//     password,
//     firstName,
//     lastName,
//     name,
//     phone,
//     image,
//     userType = UserType.SCHOOL_ADMIN,
//     loginId,
//     schoolId,
//   } = data;

//   try {
//     return await db.$transaction(async (tx) => {
//       // Check for existing user by phone (always unique)
//       const existingUserByPhone = await tx.user.findUnique({
//         where: { phone },
//       });

//       if (existingUserByPhone) {
//         return {
//           error: `This phone number ${phone} is already in use`,
//           status: 409,
//           data: null,
//         };
//       }

//       // Email uniqueness check — only relevant for SCHOOL_ADMIN
//       if (email) {
//         const existingUserByEmail = await tx.user.findUnique({
//           where: { email },
//         });
//         if (existingUserByEmail) {
//           return {
//             error: `This email ${email} is already in use`,
//             status: 409,
//             data: null,
//           };
//         }
//       }

//       // loginId uniqueness within a school — for STAFF / STUDENT / PARENT
//       if (loginId && schoolId) {
//         const existingByLoginId = await tx.user.findUnique({
//           where: { schoolId_loginId: { schoolId, loginId } },
//         });
//         if (existingByLoginId) {
//           return {
//             error: `This login ID ${loginId} is already in use within this school`,
//             status: 409,
//             data: null,
//           };
//         }
//       }

//       // Find or create default role
//       let defaultRole = await tx.role.findFirst({
//         where: { roleName: DEFAULT_USER_ROLE.roleName },
//       });

//       if (!defaultRole) {
//         defaultRole = await tx.role.create({
//           data: DEFAULT_USER_ROLE,
//         });
//       }

//       const hashedPassword = await bcrypt.hash(password, 10);

//       const newUser = await tx.user.create({
//         data: {
//           email: email ?? null,
//           password: hashedPassword,
//           firstName,
//           lastName,
//           name,
//           phone,
//           image,
//           userType,
//           loginId: loginId ?? null,
//           schoolId: schoolId ?? null,
//           roles: {
//             connect: { id: defaultRole.id },
//           },
//         },
//         include: {
//           roles: true,
//           schoolAdmins: true,
//         },
//       });

//       return {
//         error: null,
//         status: 200,
//         data: newUser,
//       };
//     });
//   } catch (error) {
//     console.error("Error creating user:", error);
//     return {
//       error: `Something went wrong, please try again`,
//       status: 500,
//       data: null,
//     };
//   }
// }

// export async function getAllMembers() {
//   try {
//     const members = await db.user.findMany({
//       select: {
//         id: true,
//         name: true,
//       },
//     });
//     return members;
//   } catch (error) {
//     console.error("Error fetching members:", error);
//     return [];
//   }
// }

// export async function getAllUsers() {
//   try {
//     const users = await db.user.findMany({
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: {
//         roles: true,
//         schoolAdmins: true,
//       },
//     });
//     return users;
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return [];
//   }
// }

// export async function deleteUser(id: string) {
//   try {
//     const deleted = await db.user.delete({
//       where: { id },
//     });
//     return { ok: true, data: deleted };
//   } catch (error) {
//     console.error("Error deleting user:", error);
//     return { ok: false, data: null };
//   }
// }

// export async function getUserById(id: string) {
//   try {
//     const user = await db.user.findUnique({
//       where: { id },
//       include: {
//         roles: true,
//         schoolAdmins: true,
//         school: true,
//       },
//     });
//     return user;
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     return null;
//   }
// }

// export async function sendResetLink(email: string) {
//   try {
//     // Only SCHOOL_ADMIN accounts have emails — query accordingly
//     const user = await db.user.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return {
//         status: 404,
//         error: "We cannot associate this email with any user",
//         data: null,
//       };
//     }

//     const token = generateToken();

//     await db.user.update({
//       where: { email },
//       data: { token },
//     });

//     const userFirstname = user.firstName;
//     const resetPasswordLink = `${baseUrl}/reset-password?token=${token}&&email=${email}`;

//     const { data, error } = await resend.emails.send({
//       from: "NextAdmin <info@desishub.com>",
//       to: email,
//       subject: "Reset Password Request",
//       react: ResetPasswordEmail({ userFirstname, resetPasswordLink }),
//     });

//     if (error) {
//       return {
//         status: 500,
//         error: error.message,
//         data: null,
//       };
//     }

//     return {
//       status: 200,
//       error: null,
//       data,
//     };
//   } catch (error) {
//     console.error("Error sending reset link:", error);
//     return {
//       status: 500,
//       error: "Failed to send reset email",
//       data: null,
//     };
//   }
// }

// export async function updateUserPassword(id: string, data: PasswordProps) {
//   try {
//     const existingUser = await db.user.findUnique({ where: { id } });

//     if (!existingUser || !existingUser.password) {
//       return { error: "User not found", status: 404 };
//     }

//     const passwordMatch = await compare(data.oldPassword, existingUser.password);

//     if (!passwordMatch) {
//       return { error: "Old password is incorrect", status: 403 };
//     }

//     const hashedPassword = await bcrypt.hash(data.newPassword, 10);

//     await db.user.update({
//       where: { id },
//       data: { password: hashedPassword },
//     });

//     revalidatePath("/dashboard/clients");
//     return { error: null, status: 200 };
//   } catch (error) {
//     console.error("Error updating password:", error);
//     return { error: "Something went wrong", status: 500 };
//   }
// }

// export async function resetUserPassword(
//   email: string,
//   token: string,
//   newPassword: string
// ) {
//   try {
//     const user = await db.user.findFirst({
//       where: { email, token },
//     });

//     if (!user) {
//       return {
//         status: 404,
//         error: "Please use a valid reset link",
//         data: null,
//       };
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await db.user.update({
//       where: { id: user.id },
//       data: {
//         password: hashedPassword,
//         token: null, // Invalidate token after use
//       },
//     });

//     return {
//       status: 200,
//       error: null,
//       data: null,
//     };
//   } catch (error) {
//     console.error("Error resetting password:", error);
//     return {
//       status: 500,
//       error: "Failed to reset password",
//       data: null,
//     };
//   }
// }

// // ─── New helpers for the multi-tenant auth flow ─────────────────────────────

// /**
//  * Look up a user by their loginId scoped to a school.
//  * Used for STAFF / STUDENT / PARENT login flows.
//  */
// export async function getUserByLoginId(schoolId: string, loginId: string) {
//   try {
//     return await db.user.findUnique({
//       where: { schoolId_loginId: { schoolId, loginId } },
//       include: { roles: true, school: true },
//     });
//   } catch (error) {
//     console.error("Error fetching user by loginId:", error);
//     return null;
//   }
// }

// /**
//  * Increment failed login attempts and optionally lock the account.
//  * Lock threshold: 5 attempts → 30-minute lockout.
//  */
// export async function recordFailedLogin(userId: string) {
//   try {
//     const user = await db.user.findUnique({
//       where: { id: userId },
//       select: { failedLoginAttempts: true },
//     });

//     if (!user) return;

//     const attempts = (user.failedLoginAttempts ?? 0) + 1;
//     const lockedUntil =
//       attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

//     await db.user.update({
//       where: { id: userId },
//       data: {
//         failedLoginAttempts: attempts,
//         ...(lockedUntil ? { lockedUntil } : {}),
//       },
//     });
//   } catch (error) {
//     console.error("Error recording failed login:", error);
//   }
// }

// /**
//  * Clear failed login attempts and update last login metadata on success.
//  */
// export async function recordSuccessfulLogin(userId: string, ipAddress?: string) {
//   try {
//     await db.user.update({
//       where: { id: userId },
//       data: {
//         failedLoginAttempts: 0,
//         lockedUntil: null,
//         lastLoginAt: new Date(),
//         lastLoginIp: ipAddress ?? null,
//       },
//     });
//   } catch (error) {
//     console.error("Error recording successful login:", error);
//   }
// }


"use server";

import { ResetPasswordEmail } from "@/components/email-templates/reset-password";
import { db } from "@/prisma/db";
import { UserProps } from "@/types/types";
import { revalidatePath } from "next/cache";
import { PasswordProps } from "@/components/Forms/ChangePasswordForm";
import { Resend } from "resend";
import { generateToken } from "@/lib/token";
import bcrypt, { compare } from "bcryptjs";
import { UserType } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// ── Default role assigned to every new user ──────────────────────────────────
// Note: Role.roleName is a free String field — intentionally separate from the
// UserRole enum which is only used on User.role for access control routing.
const DEFAULT_USER_ROLE = {
  displayName: "User",
  roleName: "user",
  description: "Default user role with basic permissions",
  permissions: [
    "dashboard.read",
    "profile.read",
    "profile.update",
    "orders.read",
  ],
};

// ── Lock policy ───────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ════════════════════════════════════════════════════════════════════════════
// CREATE USER
// ════════════════════════════════════════════════════════════════════════════

export async function createUser(data: UserProps) {
  const {
    email,
    password,
    firstName,
    lastName,
    name,
    phone,
    image,
    userType = UserType.SCHOOL_ADMIN,
    loginId,
    schoolId,
  } = data;

  try {
    return await db.$transaction(async (tx) => {
      // ── Phone uniqueness (always required) ─────────────────────────────
      const existingByPhone = await tx.user.findUnique({ where: { phone } });
      if (existingByPhone) {
        return {
          error: `Phone number ${phone} is already in use`,
          status: 409,
          data: null,
        };
      }

      // ── Email uniqueness — only relevant for SCHOOL_ADMIN ──────────────
      if (email) {
        const existingByEmail = await tx.user.findUnique({ where: { email } });
        if (existingByEmail) {
          return {
            error: `Email ${email} is already in use`,
            status: 409,
            data: null,
          };
        }
      }

      // ── loginId requires schoolId — guard against partial data ─────────
      // FIX [5]: loginId without schoolId would silently skip the uniqueness
      // check, potentially creating duplicate loginIds across schools.
      if (loginId && !schoolId) {
        return {
          error: "schoolId is required when loginId is provided",
          status: 400,
          data: null,
        };
      }

      // ── loginId uniqueness within the school ───────────────────────────
      if (loginId && schoolId) {
        const existingByLoginId = await tx.user.findUnique({
          where: { schoolId_loginId: { schoolId, loginId } },
        });
        if (existingByLoginId) {
          return {
            error: `Login ID ${loginId} is already in use within this school`,
            status: 409,
            data: null,
          };
        }
      }

      // ── Find or create the default role ────────────────────────────────
      let defaultRole = await tx.role.findFirst({
        where: { roleName: DEFAULT_USER_ROLE.roleName },
      });
      if (!defaultRole) {
        defaultRole = await tx.role.create({ data: DEFAULT_USER_ROLE });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await tx.user.create({
        data: {
          email: email ?? null,
          password: hashedPassword,
          firstName,
          lastName,
          name,
          phone,
          image,
          userType,
          loginId: loginId ?? null,
          schoolId: schoolId ?? null,
          roles: { connect: { id: defaultRole.id } },
        },
        include: {
          roles: true,
          schoolAdmins: true,
        },
      });

      return { error: null, status: 200, data: newUser };
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Something went wrong, please try again", status: 500, data: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READ — all users
// FIX [4]: schoolId-scoped to prevent cross-tenant data leaks.
// Pass schoolId = undefined only for super-admin contexts.
// ════════════════════════════════════════════════════════════════════════════

export async function getAllUsers(schoolId?: string) {
  try {
    const users = await db.user.findMany({
      where: schoolId ? { schoolId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        roles: true,
        schoolAdmins: true,
      },
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getAllMembers(schoolId?: string) {
  try {
    const members = await db.user.findMany({
      where: schoolId ? { schoolId } : undefined,
      select: { id: true, name: true },
    });
    return members;
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        roles: true,
        schoolAdmins: true,
        school: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════

export async function deleteUser(id: string) {
  try {
    const deleted = await db.user.delete({ where: { id } });
    return { ok: true, data: deleted };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { ok: false, data: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PASSWORD MANAGEMENT
// FIX [6]: Reset-by-email is only valid for SCHOOL_ADMIN accounts.
//          STAFF / STUDENT / PARENT accounts use a different recovery flow.
// ════════════════════════════════════════════════════════════════════════════

export async function sendResetLink(email: string) {
  try {
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return {
        status: 404,
        error: "We cannot find an account associated with this email",
        data: null,
      };
    }

    // Only SCHOOL_ADMIN accounts can reset password via email
    if (user.userType !== UserType.SCHOOL_ADMIN) {
      return {
        status: 403,
        error:
          "Password reset via email is only available for school admin accounts. Please contact your school administrator.",
        data: null,
      };
    }

    const token = generateToken();
    await db.user.update({ where: { email }, data: { token } });

    const resetPasswordLink = `${baseUrl}/reset-password?token=${token}&&email=${email}`;

    const { data, error } = await resend.emails.send({
      from: "Skolastik <noreply@maripatechagency.com>",
      to: email,
      subject: "Reset Your Skolastik Password",
      react: ResetPasswordEmail({
        userFirstname: user.firstName,
        resetPasswordLink,
      }),
    });

    if (error) {
      return { status: 500, error: error.message, data: null };
    }

    return { status: 200, error: null, data };
  } catch (error) {
    console.error("Error sending reset link:", error);
    return { status: 500, error: "Failed to send reset email", data: null };
  }
}

export async function resetUserPassword(
  email: string,
  token: string,
  newPassword: string
) {
  try {
    const user = await db.user.findFirst({ where: { email, token } });

    if (!user) {
      return {
        status: 404,
        error: "Please use a valid reset link",
        data: null,
      };
    }

    // Guard: only SCHOOL_ADMIN should reach this path
    if (user.userType !== UserType.SCHOOL_ADMIN) {
      return {
        status: 403,
        error: "Password reset via email is not available for this account type",
        data: null,
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        token: null, // invalidate token after use
      },
    });

    return { status: 200, error: null, data: null };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { status: 500, error: "Failed to reset password", data: null };
  }
}

export async function updateUserPassword(id: string, data: PasswordProps) {
  try {
    const existingUser = await db.user.findUnique({ where: { id } });

    if (!existingUser || !existingUser.password) {
      return { error: "User not found", status: 404 };
    }

    const passwordMatch = await compare(data.oldPassword, existingUser.password);
    if (!passwordMatch) {
      return { error: "Old password is incorrect", status: 403 };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    revalidatePath("/dashboard/clients");
    return { error: null, status: 200 };
  } catch (error) {
    console.error("Error updating password:", error);
    return { error: "Something went wrong", status: 500 };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MULTI-TENANT AUTH HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Look up a user by their loginId scoped to a school.
 * Used for STAFF / STUDENT / PARENT login flows.
 */
export async function getUserByLoginId(schoolId: string, loginId: string) {
  try {
    return await db.user.findUnique({
      where: { schoolId_loginId: { schoolId, loginId } },
      include: { roles: true, school: true },
    });
  } catch (error) {
    console.error("Error fetching user by loginId:", error);
    return null;
  }
}

/**
 * FIX [3]: Check whether an account is currently locked.
 * Call this BEFORE password comparison in your login handler.
 * Returns { isLocked: true, lockedUntil } if locked, { isLocked: false } if clear.
 */
export async function checkAccountLock(userId: string): Promise<
  | { isLocked: true; lockedUntil: Date }
  | { isLocked: false; lockedUntil: null }
> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      return { isLocked: true, lockedUntil: user.lockedUntil };
    }

    // Lock has expired — clear it automatically
    if (user?.lockedUntil && user.lockedUntil <= new Date()) {
      await db.user.update({
        where: { id: userId },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
    }

    return { isLocked: false, lockedUntil: null };
  } catch (error) {
    console.error("Error checking account lock:", error);
    return { isLocked: false, lockedUntil: null };
  }
}

/**
 * Record a failed login attempt.
 * Locks the account for LOCKOUT_DURATION_MS after MAX_FAILED_ATTEMPTS failures.
 * Returns the updated attempt count so the caller can show a warning.
 */
export async function recordFailedLogin(
  userId: string
): Promise<{ attempts: number; isLocked: boolean; lockedUntil: Date | null }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    if (!user) return { attempts: 0, isLocked: false, lockedUntil: null };

    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const isLocked = attempts >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = isLocked
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        ...(lockedUntil ? { lockedUntil } : {}),
      },
    });

    return { attempts, isLocked, lockedUntil };
  } catch (error) {
    console.error("Error recording failed login:", error);
    return { attempts: 0, isLocked: false, lockedUntil: null };
  }
}

/**
 * Clear failed login state and record a successful login.
 * Call this immediately after a successful password comparison.
 */
export async function recordSuccessfulLogin(
  userId: string,
  ipAddress?: string
) {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Error recording successful login:", error);
  }
}