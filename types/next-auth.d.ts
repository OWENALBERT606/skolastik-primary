// // import { DefaultSession } from "next-auth";
// // import { Role } from "@prisma/client";

// // declare module "next-auth" {
// //     interface User {
// //     firstName?: string | null;
// //     lastName?: string | null;
// //     phone?: string | null;
// //     roles: Role[];
// //     permissions: string[];
// //   }

// //   interface Session {
// //     user: {
// //       id: string;

// //       name?: string | null;
// //       email?: string | null;
// //       image?: string | null;

// //       firstName?: string | null;
// //       lastName?: string | null;
// //       phone?: string | null;

// //       roles: Role[];
// //       permissions: string[];

// //       school?: {
// //         id: string;
// //         slug: string;
// //         name: string;
// //       } | null;
// //     } & DefaultSession["user"];
// //   }
// // }


// import { Role } from "@prisma/client";

// type ExtendedUser = {
//   id: string;
//   name?: string | null;
//   email?: string | null;
//   image?: string | null;
//   firstName?: string | null;
//   lastName?: string | null;
//   phone?: string | null;
//   roles: Role[];
//   permissions: string[];
// };

// declare module "next-auth" {
//   interface User {
//     firstName?: string | null;
//     lastName?: string | null;
//     phone?: string | null;
//     roles: Role[];
//     permissions: string[];
//   }

//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       firstName?: string | null;
//       lastName?: string | null;
//       phone?: string | null;
//       roles: Role[];
//       permissions: string[];
//       school?: {
//         id: string;
//         slug: string;
//         name: string;
//       } | null;
//     };
//   }
// }

// // ✅ Extend AdapterUser too
// declare module "next-auth/adapters" {
//   interface AdapterUser {
//     firstName?: string | null;
//     lastName?: string | null;
//     phone?: string | null;
//     roles: Role[];
//     permissions: string[];
//   }
// }

// declare module "next-auth/jwt" {
//   async jwt({ token, user }) {
//   if (user) {
//     const u = user as ExtendedUser; // ✅ cast here
//     token.id = u.id;
//     token.roles = u.roles;
//     token.permissions = u.permissions;
//     token.school = await getUserSchool(u.id, u.roles);
//   } else if (token.id) {
//     const userData = await getUserWithRoles(token.id);
//     if (userData) {
//       token.roles = userData.roles;
//       token.permissions = userData.permissions;
//       token.school = await getUserSchool(token.id, userData.roles);
//     }
//   }
//   return token;
// },
// }




import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    roles: Role[];
    permissions: string[];
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      roles: Role[];
      permissions: string[];
      school?: {
        id: string;
        slug: true;
        name: string;
      } | null;
    };
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    roles: Role[];
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
    permissions: string[];
    school?: { id: string; slug: string; name: string } | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  }
}