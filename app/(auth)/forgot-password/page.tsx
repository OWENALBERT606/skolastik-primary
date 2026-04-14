import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/Forms/ForgotPasswordForm";
import LoginForm from "@/components/Forms/LoginForm";
import { GridBackground } from "@/components/reusable-ui/grid-background";
import { authOptions } from "@/config/auth";
import { getServerSession } from "next-auth/next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Forgot Password",
  description: "Reset your Skolastik account password.",
  path: "/forgot-password",
  noIndex: true,
});
import { redirect } from "next/navigation";
import React from "react";

export default async function page() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }
  return (
    <GridBackground imageSrc="/pexels-mickael-ange-konan-2156070331-34526411.jpg">
      <div className="w-full max-w-md px-4">
        <ForgotPasswordForm />
      </div>
    </GridBackground>
  );
}
