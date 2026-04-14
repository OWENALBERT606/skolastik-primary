"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "../theme-toggle";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface NavProps {
  slug?: string;
  session?: {
    name?:  string | null;
    email?: string | null;
    image?: string | null;
    roles?: { roleName: string }[];
  };
}

export default function SchoolDashboardNav({ session, slug }: NavProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const name   = session?.name  ?? session?.email ?? "User";
  const email  = session?.email ?? "";
  const image  = session?.image ?? "";
  const role   = session?.roles?.[0]?.roleName ?? "";
  const isDOS  = role === "dos" || role === "director_of_studies";
  const roleLabel = isDOS ? "Director of Studies" : role ? role.replace(/_/g, " ") : "Admin";

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    try {
      await signOut({ redirect: false });
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="flex h-16 items-center gap-3 px-4
      border-b border-zinc-200 dark:border-slate-700/40
      bg-white dark:bg-[#0d1117]">

      <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white transition-colors shrink-0" />

      {/* Search */}
      <div className="flex-1">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm
            bg-zinc-50 dark:bg-slate-800/60
            border-zinc-200 dark:border-slate-700/60
            text-zinc-900 dark:text-white
            placeholder:text-zinc-400 dark:placeholder:text-slate-500
            focus-visible:ring-primary/30
            focus-visible:border-primary dark:focus-visible:border-primary"
        />
      </div>

      <ThemeToggle />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5
            hover:bg-zinc-100 dark:hover:bg-slate-800/60
            data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-slate-800/60
            transition-colors outline-none">
            <Avatar className="h-8 w-8 rounded-lg shrink-0">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:grid text-left text-sm leading-tight">
              <span className="truncate font-semibold text-zinc-900 dark:text-white max-w-[120px]">
                {name}
              </span>
              <span className="truncate text-xs text-zinc-500 dark:text-slate-400 capitalize">
                {roleLabel}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-zinc-400 dark:text-slate-500 shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-64 rounded-xl
            bg-white dark:bg-[#111827]
            border border-zinc-200 dark:border-slate-700/60
            shadow-lg dark:shadow-2xl"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          {/* User info header */}
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="h-9 w-9 rounded-lg shrink-0">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-zinc-900 dark:text-white">
                  {name}
                </span>
                <span className="truncate text-xs text-zinc-500 dark:text-slate-400">
                  {email}
                </span>
                <span className="truncate text-xs text-primary capitalize font-medium mt-0.5">
                  {roleLabel}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/40" />

          <DropdownMenuGroup>
            {[
              { icon: <BadgeCheck size={14} />, label: "Account" },
              { icon: <CreditCard size={14} />, label: "Billing" },
              { icon: <Bell size={14} />,       label: "Notifications" },
            ].map(({ icon, label }) => (
              <DropdownMenuItem key={label}
                className="gap-2 text-zinc-700 dark:text-slate-200
                  hover:bg-zinc-100 dark:hover:bg-slate-700/60
                  focus:bg-zinc-100 dark:focus:bg-slate-700/60
                  cursor-pointer rounded-lg mx-1 transition-colors">
                <span className="text-zinc-400 dark:text-slate-500">{icon}</span>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/40" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 text-red-500 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10
              focus:bg-red-50 dark:focus:bg-red-500/10
              focus:text-red-500 dark:focus:text-red-400
              cursor-pointer rounded-lg mx-1 mb-1 transition-colors">
            <LogOut size={14} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
