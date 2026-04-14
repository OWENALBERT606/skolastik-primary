"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BookOpen, Calendar, ChevronRight, ChevronsUpDown, Home,
  Inbox, KeyRound, LogOut, Mail, MessageSquare, GraduationCap,
  Settings, User, BarChart3, CheckCircle2, Layers, Users2, ArrowUpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SubItem = { title: string; url: string; icon?: React.ElementType };
type NavItem = { title: string; url: string; icon: React.ElementType; isActive?: boolean; items: SubItem[] };
type NavGroup = { groupLabel?: string; items: NavItem[] };

function getDOSNav(slug: string): NavGroup[] {
  return [
    {
      items: [
        {
          title: "DOS Dashboard",
          url: `/school/${slug}/dos/dashboard`,
          icon: Home,
          isActive: true,
          items: [{ title: "Overview", url: `/school/${slug}/dos/dashboard` }],
        },
      ],
    },
    {
      groupLabel: "Academics",
      items: [
        {
          title: "Academics",
          url: `/school/${slug}/dos/academics`,
          icon: BookOpen,
          items: [
            { title: "Academic Years", url: `/school/${slug}/dos/academics/years` },
            { title: "Academic Terms", url: `/school/${slug}/dos/academics/terms` },
            { title: "Classes",        url: `/school/${slug}/dos/academics/classes` },
            { title: "Streams",        url: `/school/${slug}/dos/academics/streams` },
            { title: "Subjects",       url: `/school/${slug}/dos/academics/subjects` },
            { title: "Timetable",      url: `/school/${slug}/dos/academics/timetable` },
            { title: "Approvals",        url: `/school/${slug}/dos/academics/approvals` },
            { title: "Report Cards",     url: `/school/${slug}/dos/academics/report-cards` },
            { title: "Bulk Promotions",  url: `/school/${slug}/dos/academics/bulk-promotions`, icon: ArrowUpCircle },
            { title: "Project Works",    url: `/school/${slug}/academics/project-works` },
          ],
        },
      ],
    },
    {
      groupLabel: "People",
      items: [
        {
          title: "Students",
          url:   `/school/${slug}/users/students`,
          icon:  GraduationCap,
          items: [
            { title: "All Students", url: `/school/${slug}/users/students` },
          ],
        },
        {
          title: "Teachers",
          url:   `/school/${slug}/dos/teachers`,
          icon:  Users2,
          items: [{ title: "All Teachers", url: `/school/${slug}/dos/teachers` }],
        },
        {
          title: "Parents",
          url:   `/school/${slug}/users/parents`,
          icon:  Users2,
          items: [{ title: "All Parents", url: `/school/${slug}/users/parents` }],
        },
      ],
    },
    {
      groupLabel: "Staff",
      items: [
        {
          title: "Staff",
          url: `/school/${slug}/dos/staff/attendance`,
          icon: Users2,
          items: [
            { title: "Attendance", url: `/school/${slug}/dos/staff/attendance` },
          ],
        },
      ],
    },
    {
      groupLabel: "Communication",
      items: [
        {
          title: "Communication",
          url: `/school/${slug}/dos/inbox`,
          icon: Mail,
          items: [
            { title: "Inbox",             url: `/school/${slug}/dos/inbox`,    icon: Inbox },
            { title: "Messages",          url: `/school/${slug}/dos/messages`, icon: MessageSquare },
            { title: "Events & Calendar", url: `/school/${slug}/dos/events`,   icon: Calendar },
          ],
        },
      ],
    },
  ];
}

export default function DOSSidebar({
  school,
  session,
  unreadCount = 0,
}: {
  school: { id: string; name: string; slug: string; logo?: string | null };
  session: { id: string; name: string; email: string; image?: string | null; hasTeacherRole: boolean };
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const navGroups = getDOSNav(school.slug);

  const initials = session.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-700/60"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-slate-200 dark:border-slate-700/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-primary/10 dark:hover:bg-slate-800 transition-colors"
              tooltip={school.name}
            >
              <div className="flex items-center justify-center bg-primary rounded-md p-1.5 text-primary-foreground shrink-0 w-9 h-9">
                {school.logo ? (
                  <Image
                    src={school.logo}
                    width={28}
                    height={28}
                    alt={school.name}
                    className="w-full h-full object-contain rounded"
                  />
                ) : (
                  <span className="text-sm font-bold leading-none">
                    {school.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {school.name}
                </span>
                <span className="text-xs text-primary">DOS Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="py-2">
        {navGroups.map((group, gi) => (
          <SidebarGroup key={gi} className="py-1">
            {group.groupLabel && (
              <SidebarGroupLabel className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.groupLabel}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const isOpen = pathname.startsWith(item.url.replace("/dashboard", ""));
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive || isOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className="hover:bg-primary/10 data-[state=open]:bg-primary/10 transition-colors rounded-lg"
                        >
                          <div className="flex items-center justify-center w-5 h-5 text-slate-500 dark:text-slate-400 group-data-[state=open]/collapsible:text-primary">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300 group-data-[state=open]/collapsible:text-primary">
                            {item.title}
                          </span>
                          <ChevronRight className="ml-auto w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-primary" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-1">
                        <SidebarMenuSub className="gap-0.5 border-l border-slate-200 dark:border-slate-700 ml-3">
                          {item.items?.map((sub) => {
                            const active = pathname === sub.url;
                            const isInbox = sub.title === "Inbox";
                            return (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={`rounded-md transition-colors pl-4 h-8 gap-2 ${
                                    active
                                      ? "bg-primary/15 text-primary"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary"
                                  }`}
                                >
                                  <Link href={sub.url} className="flex items-center gap-2">
                                    {sub.icon && (
                                      <sub.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-primary" : "text-slate-400 dark:text-slate-500"}`} />
                                    )}
                                    <span className="text-xs font-medium">{sub.title}</span>
                                    {isInbox && unreadCount > 0 && (
                                      <span className="ml-auto w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    )}
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

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors rounded-lg"
                >
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={session.image ?? ""} alt={session.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">{session.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">{session.email}</p>
                  </div>
                  <ChevronsUpDown className="ml-auto w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 rounded-xl bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-700/60 shadow-lg"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{session.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{session.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/60" />
                <DropdownMenuItem asChild className="gap-2 px-3 py-2 text-sm cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:bg-zinc-50 dark:focus:bg-slate-800/60">
                  <Link href={`/school/${school.slug}/dos/profile`}>
                    <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 px-3 py-2 text-sm cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:bg-zinc-50 dark:focus:bg-slate-800/60">
                  <Link href={`/school/${school.slug}/dos/settings`}>
                    <Settings className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 px-3 py-2 text-sm cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:bg-zinc-50 dark:focus:bg-slate-800/60">
                  <Link href="/dashboard/change-password">
                    <KeyRound className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    Change Password
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-slate-700/60" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 px-3 py-2 text-sm cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:bg-red-50 dark:focus:bg-red-900/20"
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
