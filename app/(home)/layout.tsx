import { FooterSection } from "@/components/footer-section";
import PromoBanner from "@/components/frontend/PromoBanner";
import Footer from "@/components/frontend/site-footer";
import SiteHeader from "@/components/frontend/site-header";
import { authOptions } from "@/config/auth";
import { getServerSession } from "next-auth/next";
import React, { ReactNode } from "react";
export default async function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <div className="">
      {/* <PromoBanner /> */}
      {/* <SiteHeader session={session}/> */}
      {children}
      {/* <FooterSection /> */}
    </div>
  );
}
