"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle }    from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronsUpDown, LogOut, Users } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  session: { name: string; email: string; image?: string | null };
  schoolName: string;
}

export default function ParentNav({ session, schoolName }: Props) {
  const initials = session.name
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-14 items-center gap-3 px-4 border-b border-zinc-200 dark:border-slate-700/40 bg-white dark:bg-[#0d1117] sticky top-0 z-30">
      {/* Sidebar toggle — works on all screen sizes */}
      <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white transition-colors" />

      {/* Portal badge */}
      <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
        <Users className="h-3.5 w-3.5" />
        Parent Portal
      </span>

      {/* School name on mobile */}
      <span className="sm:hidden text-sm font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">
        {schoolName}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <Bell size={16} />
        </button>
        <ThemeToggle />

        <div className="pl-2 border-l border-zinc-200 dark:border-slate-700/40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-slate-800/60 rounded-lg px-2 py-1 transition-colors">
                <Avatar className="h-7 w-7 rounded-lg shrink-0">
                  <AvatarImage src={session.image ?? ""} alt={session.name} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-zinc-900 dark:text-white leading-none">{session.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{session.email}</p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"
              className="w-56 rounded-xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 shadow-lg">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={session.image ?? ""} alt={session.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{session.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{session.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/60" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="gap-2 px-3 py-2 text-sm cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
