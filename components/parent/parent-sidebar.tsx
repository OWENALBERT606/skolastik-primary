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
  BookOpen, ChevronRight, ChevronsUpDown, Home, LogOut,
  GraduationCap, CalendarDays, CreditCard, Users, Bell, Settings, CalendarRange,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem  = { title: string; url: string; icon: React.ElementType; isActive?: boolean; items: { title: string; url: string }[] };
type NavGroup = { groupLabel?: string; items: NavItem[] };

function getParentNav(slug: string): NavGroup[] {
  return [
    {
      items: [
        {
          title: "Dashboard",
          url:   `/school/${slug}/parent/dashboard`,
          icon:  Home,
          isActive: true,
          items: [{ title: "Overview", url: `/school/${slug}/parent/dashboard` }],
        },
      ],
    },
    {
      groupLabel: "My Children",
      items: [
        {
          title: "Results",
          url:   `/school/${slug}/parent/results`,
          icon:  GraduationCap,
          items: [{ title: "Academic Results", url: `/school/${slug}/parent/results` }],
        },
        {
          title: "Attendance",
          url:   `/school/${slug}/parent/attendance`,
          icon:  CalendarDays,
          items: [{ title: "Attendance Records", url: `/school/${slug}/parent/attendance` }],
        },
        {
          title: "Finance",
          url:   `/school/${slug}/parent/finance`,
          icon:  CreditCard,
          items: [{ title: "Fees & Payments", url: `/school/${slug}/parent/finance` }],
        },
      ],
    },
    {
      groupLabel: "School",
      items: [
        {
          title: "Events & Calendar",
          url:   `/school/${slug}/parent/events`,
          icon:  CalendarRange,
          items: [{ title: "School Events", url: `/school/${slug}/parent/events` }],
        },
      ],
    },
    {
      groupLabel: "Communication",
      items: [
        {
          title: "Notifications",
          url:   `/school/${slug}/parent/notifications`,
          icon:  Bell,
          items: [{ title: "School Notices", url: `/school/${slug}/parent/notifications` }],
        },
      ],
    },
  ];
}

export default function ParentSidebar({
  school,
  session,
}: {
  school:  { id: string; name: string; slug: string; logo?: string | null };
  session: { id: string; name: string; email: string; image?: string | null };
}) {
  const pathname  = usePathname();
  const navGroups = getParentNav(school.slug);

  const initials = session.name
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

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
                <span className="text-xs text-primary">Parent Portal</span>
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
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map(sub => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                                <Link href={sub.url}>{sub.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
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

      <SidebarFooter className="border-t border-slate-200 dark:border-slate-700/60 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="hover:bg-primary/10 rounded-lg">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={session.image ?? ""} alt={session.name} />
                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-semibold text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 text-left">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{session.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{session.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto w-4 h-4 text-slate-400 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56 rounded-xl shadow-lg">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm">{session.name}</span>
                    <span className="text-xs text-muted-foreground">{session.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 dark:text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
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
