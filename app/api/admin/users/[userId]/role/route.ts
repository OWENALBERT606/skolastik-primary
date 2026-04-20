import { db }            from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { roleId } = await req.json();

    if (!userId || !roleId) {
      return NextResponse.json({ error: "userId and roleId required" }, { status: 400 });
    }

    const [user, role] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, include: { roles: true } }),
      db.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    // Disconnect all existing roles, connect the new one
    await db.user.update({
      where: { id: userId },
      data:  {
        roles: {
          disconnect: user.roles.map(r => ({ id: r.id })),
          connect:    { id: roleId },
        },
      },
    });

    return NextResponse.json({ ok: true, message: `Role updated to ${role.displayName}` });
  } catch (error: any) {
    console.error("❌ update user role:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to update role" }, { status: 500 });
  }
}
