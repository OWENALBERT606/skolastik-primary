"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail,
} from "@/components/ui/sidebar";
import {
  BookOpen, ChevronRight, ChevronsUpDown, ClipboardList, Home, KeyRound,
  LogOut, Settings, User, GraduationCap, Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem  = { title: string; url: string; icon: React.ElementType; isActive?: boolean; items: { title: string; url: string }[] };
type NavGroup = { groupLabel?: string; items: NavItem[] };

function getStudentNav(slug: string): NavGroup[] {
  return [
    {
      items: [
        {
          title:    "Dashboard",
          url:      `/school/${slug}/student/dashboard`,
          icon:     Home,
          isActive: true,
          items:    [{ title: "Overview", url: `/school/${slug}/student/dashboard` }],
        },
      ],
    },
    {
      groupLabel: "Academics",
      items: [
        {
          title: "Learning Resources",
          url:   `/school/${slug}/student/resources`,
          icon:  Download,
          items: [{ title: "Notes & Past Papers", url: `/school/${slug}/student/resources` }],
        },
        {
          title: "Assignments",
          url:   `/school/${slug}/student/assignments`,
          icon:  ClipboardList,
          items: [{ title: "My Assignments", url: `/school/${slug}/student/assignments` }],
        },
        {
          title: "My Results",
          url:   `/school/${slug}/student/results`,
          icon:  GraduationCap,
          items: [{ title: "View Results", url: `/school/${slug}/student/results` }],
        },
      ],
    },
  ];
}

export default function StudentSidebar({
  school,
  session,
}: {
  school:  { id: string; name: string; slug: string; logo?: string | null };
  session: { id: string; name: string; email: string; image?: string | null };
}) {
  const pathname   = usePathname();
  const navGroups  = getStudentNav(school.slug);

  const initials = session.name
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-700/60"
    >
      <SidebarHeader className="border-b border-slate-200 dark:border-slate-700/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={school.name}>
              <div className="flex items-center justify-center bg-primary rounded-md p-1.5 shrink-0">
                <Image src={school.logo || "/placeholder.svg"} width={24} height={24} alt={school.name} className="w-6 h-6 object-contain" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{school.name}</span>
                <span className="text-xs text-primary">Student Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {navGroups.map((group, gi) => (
          <SidebarGroup key={gi} className="py-1">
            {group.groupLabel && (
              <SidebarGroupLabel className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.groupLabel}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-1">
              {group.items.map(item => {
                const isOpen = pathname.startsWith(item.url.replace("/dashboard", ""));
                return (
                  <Collapsible key={item.title} asChild defaultOpen={item.isActive || isOpen} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className="hover:bg-primary/10 data-[state=open]:bg-primary/10 transition-colors rounded-lg">
                          <div className="flex items-center justify-center w-5 h-5 text-slate-500 dark:text-slate-400 group-data-[state=open]/collapsible:text-primary">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300 group-data-[state=open]/collapsible:text-primary">
                            {item.title}
                          </span>
                          <ChevronRight className="ml-auto w-4 h-4 text-slate-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-primary" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-1">
                        <SidebarMenuSub className="gap-0.5 border-l border-slate-200 dark:border-slate-700 ml-3">
                          {item.items.map(sub => {
                            const active = pathname === sub.url;
                            return (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild className={`rounded-md transition-colors pl-4 h-8 gap-2 ${
                                  active
                                    ? "bg-primary/15 text-primary"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary"
                                }`}>
                                  <Link href={sub.url}>
                                    <span className="text-xs font-medium">{sub.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors rounded-lg">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={session.image ?? ""} alt={session.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">{session.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">{session.email}</p>
                  </div>
                  <ChevronsUpDown className="ml-auto w-4 h-4 text-slate-400 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 rounded-xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 shadow-lg">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{session.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{session.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 px-3 py-2 text-sm cursor-pointer">
                  <Link href="/dashboard/change-password">
                    <KeyRound className="w-4 h-4 text-zinc-400" />
                    Change Password
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="gap-2 px-3 py-2 text-sm cursor-pointer text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
