// app/(school)/school/[slug]/settings/components/settings-tab-nav.tsx
"use client";

import Link        from "next/link";
import { usePathname } from "next/navigation";
import { User, Palette } from "lucide-react";

const tabs = (slug: string) => [
  { label: "School Profile", href: `/school/${slug}/settings/profile`,    icon: User    },
  { label: "Appearance",     href: `/school/${slug}/settings/appearance`,  icon: Palette },
];

export default function SettingsTabNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
      {tabs(slug).map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? "border-primary text-primary dark:text-primary"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
