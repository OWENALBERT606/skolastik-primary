"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle }    from "@/components/theme-toggle";
import { Bell, Search, ChevronDown, BookMarked, GraduationCap, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Capabilities } from "@/lib/utils/capabilities";

interface Props {
  session: { name: string; email: string; isDOS: boolean };
  slug:    string;
  caps:    Capabilities;
}

export default function TeacherNav({ session, slug, caps }: Props) {
  const [search, setSearch] = useState("");
  const hasMultipleRoles = caps.isDOS || caps.isHeadTeacher;

  return (
    <div className="flex h-14 items-center gap-3 px-4 border-b border-zinc-200 dark:border-slate-700/40 bg-white dark:bg-[#0d1117]">
      <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white transition-colors" />

      {/* Role switcher — only shown when user has multiple roles */}
      {hasMultipleRoles ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
              <GraduationCap className="h-3.5 w-3.5" />
              Teacher
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl">
            <DropdownMenuItem className="gap-2 text-sm" disabled>
              <Check className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Teacher Portal</span>
            </DropdownMenuItem>
            {caps.isDOS && (
              <DropdownMenuItem asChild className="gap-2 text-sm cursor-pointer">
                <Link href={`/school/${slug}/dos/dashboard`}>
                  <BookMarked className="h-3.5 w-3.5 text-slate-400" />
                  Director of Studies
                </Link>
              </DropdownMenuItem>
            )}
            {caps.isHeadTeacher && (
              <DropdownMenuItem asChild className="gap-2 text-sm cursor-pointer">
                <Link href={`/school/${slug}/dos/dashboard`}>
                  <BookMarked className="h-3.5 w-3.5 text-slate-400" />
                  Head Teacher
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Teacher Portal
        </span>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-50 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/60 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-800/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <Bell size={16} />
        </button>
        <ThemeToggle />
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-slate-700/40">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {session.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-zinc-900 dark:text-white leading-none">{session.name}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{session.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
