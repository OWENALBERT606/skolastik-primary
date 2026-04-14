"use client";

import Link from "next/link";
import { BookMarked, GraduationCap, ChevronRight, School, ShieldCheck, Wallet } from "lucide-react";

type Props = {
  firstName:     string;
  slug:          string;
  isDOS:         boolean;
  isHeadTeacher: boolean;
  isDeputy:      boolean;
  isBursar:      boolean;
  isTeacher:     boolean;
};

export default function PortalSelectClient({
  firstName, slug, isDOS, isHeadTeacher, isDeputy, isBursar, isTeacher,
}: Props) {
  const portals: {
    href:        string;
    label:       string;
    description: string;
    icon:        React.ReactNode;
    accent:      string;
    border:      string;
    iconBg:      string;
  }[] = [];

  if (isDOS) {
    portals.push({
      href:        `/school/${slug}/dos/dashboard`,
      label:       "Director of Studies",
      description: "Academic oversight · mark approvals · teacher assignments",
      icon:        <BookMarked className="h-6 w-6 text-primary" />,
      accent:      "group-hover:text-primary",
      border:      "hover:border-primary",
      iconBg:      "bg-primary/10 group-hover:bg-primary/20",
    });
  }

  if (isHeadTeacher && !isDOS) {
    portals.push({
      href:        `/school/${slug}/dos/dashboard`,
      label:       "Head Teacher",
      description: "School-wide oversight · report publishing · staff management",
      icon:        <ShieldCheck className="h-6 w-6 text-primary" />,
      accent:      "group-hover:text-primary",
      border:      "hover:border-primary",
      iconBg:      "bg-primary/10 group-hover:bg-primary/20",
    });
  }

  if (isDeputy && !isDOS && !isHeadTeacher) {
    portals.push({
      href:        `/school/${slug}/dos/dashboard`,
      label:       "Deputy Head",
      description: "Academic support · delegated oversight",
      icon:        <ShieldCheck className="h-6 w-6 text-primary" />,
      accent:      "group-hover:text-primary",
      border:      "hover:border-primary",
      iconBg:      "bg-primary/10 group-hover:bg-primary/20",
    });
  }

  if (isBursar) {
    portals.push({
      href:        `/school/${slug}/bursar/dashboard`,
      label:       "Bursar Portal",
      description: "Fees · payments · invoices · expenses · inventory",
      icon:        <Wallet className="h-6 w-6 text-primary" />,
      accent:      "group-hover:text-primary",
      border:      "hover:border-primary",
      iconBg:      "bg-primary/10 group-hover:bg-primary/20",
    });
  }

  if (isTeacher) {
    portals.push({
      href:        `/school/${slug}/teacher/dashboard`,
      label:       "Teacher Portal",
      description: "Assigned subjects · mark entry · student progress",
      icon:        <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />,
      accent:      "group-hover:text-green-600 dark:group-hover:text-green-400",
      border:      "hover:border-green-500 dark:hover:border-green-500",
      iconBg:      "bg-green-50 dark:bg-green-950/60 group-hover:bg-green-100 dark:group-hover:bg-green-900/60",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <School className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            You have access to {portals.length} portal{portals.length > 1 ? "s" : ""}. Choose where to continue.
          </p>
        </div>

        {/* Portal cards */}
        <div className="space-y-3">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className={`flex items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all group ${portal.border}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${portal.iconBg}`}>
                {portal.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-slate-800 dark:text-slate-100 transition-colors ${portal.accent}`}>
                  {portal.label}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {portal.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          You can switch portals anytime from the navigation bar
        </p>
      </div>
    </div>
  );
}
