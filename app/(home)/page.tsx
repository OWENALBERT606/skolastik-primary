import type { Metadata } from "next";
import WelcomePage from "../../components/somalite/front/landing-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Skolastik School Solutions — Uganda's #1 School Management Platform",
  description:
    "Skolastik is Uganda's all-in-one school management platform. Manage academics, fees, report cards, timetables, payroll, and parent communication — all in one place.",
  path: "/",
});

export default function Page() {
  return <WelcomePage />;
}
