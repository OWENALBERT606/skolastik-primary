// import { authOptions } from "@/config/auth";
// import NextAuth from "next-auth";

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };



// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth/next";
import { authOptions } from "@/config/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };