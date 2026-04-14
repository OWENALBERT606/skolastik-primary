

// "use client"
// import React from 'react'
// import {
//     Collapsible,
//     CollapsibleContent,
//     CollapsibleTrigger,
//   } from "@/components/ui/collapsible";
//   import {
//     Sidebar,
//     SidebarContent,
//     SidebarFooter,
//     SidebarGroup,
//     SidebarGroupLabel,
//     SidebarHeader,
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
//     SidebarMenuSub,
//     SidebarMenuSubButton,
//     SidebarMenuSubItem,
//     SidebarRail,
//   } from "@/components/ui/sidebar";

//   import {
//     BadgeDollarSign,
//     Banknote,
//     BarChart3,
//     BookOpen,
//     Building2,
//     ChevronRight,
//     CreditCard,
//     FileText,
//     GraduationCap,
//     Home,
//     ListChecks,
//     Mail,
//     Receipt,
//     Settings2,
//     ShieldCheck,
//     Tag,
//     UserCog,
//     Users2,
//     Wallet,
//   } from "lucide-react";

// import Link from 'next/link';
// import Image from 'next/image';
// import { signOut } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { UserDropdownMenu } from '../UserDropdownMenu';

// // ════════════════════════════════════════════════════════════════════════════
// // TYPES
// // ════════════════════════════════════════════════════════════════════════════

// type SubItem = {
//   title: string;
//   url: string;
//   icon?: React.ElementType;
// };

// type NavItem = {
//   title: string;
//   url: string;
//   icon: React.ElementType;
//   isActive?: boolean;
//   items: SubItem[];
// };

// type NavGroup = {
//   groupLabel?: string;
//   items: NavItem[];
// };

// // ════════════════════════════════════════════════════════════════════════════
// // NAV CONFIG
// // ════════════════════════════════════════════════════════════════════════════

// const getSidebarGroups = (slug: string): NavGroup[] => [
//   // ── MAIN ─────────────────────────────────────────────────────────────────
//   {
//     items: [
//       {
//         title: "Dashboard",
//         url: `/school/${slug}/dashboard`,
//         icon: Home,
//         isActive: true,
//         items: [
//           { title: "Overview", url: `/school/${slug}/dashboard` },
//         ],
//       },
//     ],
//   },

//   // ── ACADEMICS ────────────────────────────────────────────────────────────
//   {
//     groupLabel: "Academics",
//     items: [
//       {
//         title: "Academics",
//         url: `/school/${slug}/academics`,
//         icon: BookOpen,
//         items: [
//           { title: "Academic Years", url: `/school/${slug}/academics/years` },
//           { title: "Academic Terms", url: `/school/${slug}/academics/terms` },
//           { title: "Classes",        url: `/school/${slug}/academics/classes` },
//           { title: "Streams",        url: `/school/${slug}/academics/streams` },
//           { title: "Subjects",       url: `/school/${slug}/academics/subjects` },
//           { title: "Approvals",      url: `/school/${slug}/academics/approvals` },
//         ],
//       },
//       {
//         title: "Students",
//         url: `/school/${slug}/students`,
//         icon: GraduationCap,
//         items: [
//           { title: "All Students", url: `/school/${slug}/users/students` },
//           { title: "Attendance",   url: `/school/${slug}/students/attendance` },
//         ],
//       },
//       {
//         title: "Users",
//         url: `/school/${slug}/users`,
//         icon: Users2,
//         items: [
//           { title: "Parents",  url: `/school/${slug}/users/parents` },
//           { title: "Teachers", url: `/school/${slug}/users/teachers` },
//         ],
//       },
//     ],
//   },

//   // ── FINANCE ──────────────────────────────────────────────────────────────
//   {
//     groupLabel: "Finance",
//     items: [
//       {
//         title: "Fees Management",
//         url: `/school/${slug}/finance/fees`,
//         icon: CreditCard,
//         items: [
//           { title: "Overview",           url: `/school/${slug}/finance/fees`,                icon: BarChart3       },
//           { title: "Fee Categories",     url: `/school/${slug}/finance/fees/categories`,     icon: Tag             },
//           { title: "Fee Structures",     url: `/school/${slug}/finance/fees/structures`,     icon: ListChecks      },
//           { title: "Student Accounts",   url: `/school/${slug}/finance/fees/accounts`,       icon: Wallet          },
//           { title: "Invoices",           url: `/school/${slug}/finance/fees/invoices`,       icon: FileText        },
//           { title: "Payments",           url: `/school/${slug}/finance/fees/payments`,       icon: Receipt         },
//           { title: "Bursaries",          url: `/school/${slug}/finance/fees/bursaries`,      icon: BadgeDollarSign },
//           { title: "Installment Plans",  url: `/school/${slug}/finance/fees/installments`,   icon: Banknote        },
//           { title: "Penalty Rules",      url: `/school/${slug}/finance/fees/penalties`,      icon: ShieldCheck     },
//           { title: "Auto-Invoice Config",url: `/school/${slug}/finance/fees/config`,         icon: Settings2       },
//           { title: "Reports",            url: `/school/${slug}/finance/fees/reports`,        icon: BarChart3       },
//         ],
//       },
//       {
//         title: "Staff & Payroll",
//         url: `/school/${slug}/finance/staff`,
//         icon: UserCog,
//         items: [
//           { title: "Staff Management",  url: `/school/${slug}/staff` },
//           { title: "Payroll Management", url: `/school/${slug}/staff/payroll` },
//           { title: "Leave Management", url: `/school/${slug}/staff/leave` },
//           { title: "Training", url: `/school/${slug}/staff/training` },
//           { title: "Staff Attendance", url: `/school/${slug}/staff/attendance` },
//           { title: "Notice Board", url: `/school/${slug}/staff/notice-board` },
//           { title: "Staff Offboarding", url: `/school/${slug}/staff/offboarding` },


//         ],
//       },
//      {
//   title: "Expenses & Inventory",
//   url: `/school/${slug}/finance/expense`,
//   icon: Building2,
//   items: [
//     { title: "Expense Records", url: `/school/${slug}/finance/expense` },
//     { title: "Vendors",         url: `/school/${slug}/finance/expense/vendors` },
//     { title: "Categories",      url: `/school/${slug}/finance/expense/categories` },
//     { title: "Inventory",       url: `/school/${slug}/finance/inventory` },
//   ],
// },
//     ],
//   },

//   // ── SYSTEM ───────────────────────────────────────────────────────────────
//   {
//     groupLabel: "System",
//     items: [
//       {
//         title: "Communication",
//         url: `/school/${slug}/communication`,
//         icon: Mail,
//         items: [
//           { title: "Messages", url: `/school/${slug}/communication/messages` },
//           { title: "Events",   url: `/school/${slug}/communication/events` },
//         ],
//       },
//       {
//         title: "Settings",
//         url: `/school/${slug}/settings`,
//         icon: Settings2,
//         items: [
//           { title: "School Profile",  url: `/school/${slug}/settings/profile` },
//           { title: "User Management", url: `/school/${slug}/settings/users` },
//         ],
//       },
//     ],
//   },
// ];

// // ════════════════════════════════════════════════════════════════════════════
// // COMPONENT
// // ════════════════════════════════════════════════════════════════════════════

// export default function SchoolSidebar({
//   session,
//   school,
// }: {
//   session: any;
//   school: any;
// }) {
//   const router = useRouter();
//   const navGroups = getSidebarGroups(school.slug);

//   async function handleLogout() {
//     try {
//       await signOut();
//       router.push("/");
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   return (
//     <Sidebar collapsible="icon" className="bg-gradient-to-b from-slate-50 to-white">

//       {/* ── HEADER ─────────────────────────────────────────────────────── */}
//       <SidebarHeader className="border-b border-slate-200">
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton
//               size="lg"
//               className="hover:bg-slate-100 transition-colors"
//               tooltip={school.name}
//             >
//               <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-md p-1.5 text-white">
//                 <Image
//                   src={school.logo || "/placeholder.svg"}
//                   width={24}
//                   alt={school.name}
//                   height={24}
//                   className="w-6 h-6"
//                 />
//               </div>
//               <div className="flex flex-col flex-1">
//                 <span className="font-semibold text-sm text-slate-900 truncate">
//                   {school.name}
//                 </span>
//                 <span className="text-xs text-slate-500">School Admin</span>
//               </div>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       {/* ── CONTENT ────────────────────────────────────────────────────── */}
//       <SidebarContent className="py-2">
//         {navGroups.map((group, groupIndex) => (
//           <SidebarGroup key={groupIndex} className="py-1">

//             {group.groupLabel && (
//               <SidebarGroupLabel className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
//                 {group.groupLabel}
//               </SidebarGroupLabel>
//             )}

//             <SidebarMenu className="gap-1">
//               {group.items.map((item) => (
//                 <Collapsible
//                   key={item.title}
//                   asChild
//                   defaultOpen={item.isActive}
//                   className="group/collapsible"
//                 >
//                   <SidebarMenuItem>
//                     <CollapsibleTrigger asChild>
//                       <SidebarMenuButton
//                         tooltip={item.title}
//                         className="hover:bg-blue-50 data-[state=open]:bg-blue-50 transition-colors rounded-lg"
//                       >
//                         <div className="flex items-center justify-center w-5 h-5 text-slate-600 group-data-[state=open]/collapsible:text-blue-600">
//                           {item.icon && <item.icon className="w-5 h-5" />}
//                         </div>
//                         <span className="font-medium text-slate-700 group-data-[state=open]/collapsible:text-blue-700">
//                           {item.title}
//                         </span>
//                         <ChevronRight className="ml-auto w-4 h-4 text-slate-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-blue-600" />
//                       </SidebarMenuButton>
//                     </CollapsibleTrigger>

//                     <CollapsibleContent className="pt-1">
//                       <SidebarMenuSub className="gap-0.5 border-l border-slate-200 ml-3">
//                         {item.items?.map((subItem) => (
//                           <SidebarMenuSubItem key={subItem.title}>
//                             <SidebarMenuSubButton
//                               asChild
//                               className="rounded-md hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 pl-4 h-8 gap-2"
//                             >
//                               <Link href={subItem.url} className="flex items-center gap-2">
//                                 {subItem.icon && (
//                                   <subItem.icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
//                                 )}
//                                 <span className="text-xs font-medium">{subItem.title}</span>
//                               </Link>
//                             </SidebarMenuSubButton>
//                           </SidebarMenuSubItem>
//                         ))}
//                       </SidebarMenuSub>
//                     </CollapsibleContent>
//                   </SidebarMenuItem>
//                 </Collapsible>
//               ))}
//             </SidebarMenu>
//           </SidebarGroup>
//         ))}
//       </SidebarContent>

//       {/* ── FOOTER ─────────────────────────────────────────────────────── */}
//       <SidebarFooter className="border-t border-slate-200 bg-white">
//         <SidebarMenu>
//           <UserDropdownMenu
//             username={session?.user?.name ?? ""}
//             email={session?.user?.email ?? ""}
//             avatarUrl={session?.user?.image ?? "/images/screenshot-20-54.jpg"}
//           />
//         </SidebarMenu>
//       </SidebarFooter>

//       <SidebarRail />
//     </Sidebar>
//   );
// }






"use client"
import React from 'react'
import { usePathname } from 'next/navigation';
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
    BadgeDollarSign,
    Banknote,
    BarChart3,
    BookOpen,
    Building2,
    CalendarDays,
    ChevronRight,
    CreditCard,
    FileText,
    GraduationCap,
    Home,
    ListChecks,
    Mail,
    Receipt,
    Settings2,
    ShieldCheck,
    Tag,
    UserCog,
    Users2,
    Wallet,
  } from "lucide-react";

import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserDropdownMenu } from '../UserDropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type SubItem = {
  title: string;
  url: string;
  icon?: React.ElementType;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  isActive?: boolean;
  items: SubItem[];
};

type NavGroup = {
  groupLabel?: string;
  items: NavItem[];
};

// ════════════════════════════════════════════════════════════════════════════
// NAV CONFIG
// ════════════════════════════════════════════════════════════════════════════

const getTeacherGroups = (slug: string): NavGroup[] => [
  {
    items: [
      {
        title: "My Dashboard",
        url: `/school/${slug}/teacher/dashboard`,
        icon: Home,
        isActive: true,
        items: [
          { title: "Overview", url: `/school/${slug}/teacher/dashboard` },
        ],
      },
    ],
  },
  {
    groupLabel: "Teaching",
    items: [
      {
        title: "My Subjects",
        url: `/school/${slug}/teacher/dashboard`,
        icon: BookOpen,
        items: [
          { title: "Assigned Subjects", url: `/school/${slug}/teacher/dashboard` },
        ],
      },
    ],
  },
  {
    groupLabel: "Communication",
    items: [
      {
        title: "Communication",
        url: `/school/${slug}/teacher/inbox`,
        icon: Mail,
        items: [
          { title: "Inbox",            url: `/school/${slug}/teacher/inbox` },
          { title: "Messages",         url: `/school/${slug}/teacher/messages` },
          { title: "Events & Calendar",url: `/school/${slug}/teacher/events` },
        ],
      },
    ],
  },
];

const getDOSGroups = (slug: string): NavGroup[] => [
  {
    items: [
      {
        title: "DOS Dashboard",
        url: `/school/${slug}/dos/dashboard`,
        icon: Home,
        isActive: true,
        items: [
          { title: "Overview", url: `/school/${slug}/dos/dashboard` },
        ],
      },
    ],
  },
  {
    groupLabel: "Academics",
    items: [
      {
        title: "Academics",
        url: `/school/${slug}/academics`,
        icon: BookOpen,
        items: [
          { title: "Classes",      url: `/school/${slug}/academics/classes` },
          { title: "Streams",      url: `/school/${slug}/academics/streams` },
          { title: "Subjects",     url: `/school/${slug}/academics/subjects` },
          { title: "Approvals",    url: `/school/${slug}/academics/approvals` },
          { title: "Report Cards", url: `/school/${slug}/academics/report-cards` },
        ],
      },
      {
        title: "Teachers",
        url: `/school/${slug}/users/teachers`,
        icon: GraduationCap,
        items: [
          { title: "All Teachers", url: `/school/${slug}/users/teachers` },
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
          { title: "Inbox",             url: `/school/${slug}/dos/inbox` },
          { title: "Messages",          url: `/school/${slug}/dos/messages` },
          { title: "Events & Calendar", url: `/school/${slug}/dos/events` },
        ],
      },
    ],
  },
];

const getSidebarGroups = (slug: string): NavGroup[] => [
  // ── MAIN ─────────────────────────────────────────────────────────────────
  {
    items: [
      {
        title: "Dashboard",
        url: `/school/${slug}/dashboard`,
        icon: Home,
        isActive: true,
        items: [
          { title: "Overview", url: `/school/${slug}` },
        ],
      },
    ],
  },

  // ── ACADEMICS ────────────────────────────────────────────────────────────
  {
    groupLabel: "Academics",
    items: [
      {
        title: "Academics",
        url: `/school/${slug}/academics`,
        icon: BookOpen,
        items: [
          { title: "Academic Years",  url: `/school/${slug}/academics/years` },
          { title: "Academic Terms",  url: `/school/${slug}/academics/terms` },
          { title: "Classes",         url: `/school/${slug}/academics/classes` },
          { title: "Streams",         url: `/school/${slug}/academics/streams` },
          { title: "Subjects",        url: `/school/${slug}/academics/subjects` },
          { title: "Approvals",       url: `/school/${slug}/academics/approvals` },
          { title: "Report Cards",    url: `/school/${slug}/academics/report-cards` },
          { title: "Timetable",       url: `/school/${slug}/academics/timetable` },
          { title: "Bulk Promotions", url: `/school/${slug}/dos/academics/bulk-promotions` },
          { title: "Project Works",   url: `/school/${slug}/academics/project-works` },
        ],
      },
      {
        title: "Students",
        url: `/school/${slug}/students`,
        icon: GraduationCap,
        items: [
          { title: "All Students", url: `/school/${slug}/users/students` },
          { title: "Attendance",   url: `/school/${slug}/students/attendance` },
        ],
      },
    ],
  },

  // ── PEOPLE ───────────────────────────────────────────────────────────────
  {
    groupLabel: "People",
    items: [
      {
        title: "Students",
        url: `/school/${slug}/users/students`,
        icon: GraduationCap,
        items: [
          { title: "All Students", url: `/school/${slug}/users/students` },
        ],
      },
      {
        title: "Teachers",
        url: `/school/${slug}/users/teachers`,
        icon: Users2,
        items: [
          { title: "All Teachers", url: `/school/${slug}/users/teachers` },
        ],
      },
      {
        title: "Parents",
        url: `/school/${slug}/users/parents`,
        icon: Users2,
        items: [
          { title: "All Parents", url: `/school/${slug}/users/parents` },
        ],
      },
    ],
  },

  // ── FINANCE ──────────────────────────────────────────────────────────────
  {
    groupLabel: "Finance",
    items: [
      {
        title: "Fees Management",
        url: `/school/${slug}/finance/fees`,
        icon: CreditCard,
        items: [
          { title: "Overview",           url: `/school/${slug}/finance/fees`,                icon: BarChart3       },
          { title: "Fee Categories",     url: `/school/${slug}/finance/fees/categories`,     icon: Tag             },
          { title: "Fee Structures",     url: `/school/${slug}/finance/fees/structures`,     icon: ListChecks      },
          { title: "Student Accounts",   url: `/school/${slug}/finance/fees/accounts`,       icon: Wallet          },
          { title: "Invoices",           url: `/school/${slug}/finance/fees/invoices`,       icon: FileText        },
          { title: "Payments",           url: `/school/${slug}/finance/fees/payments`,       icon: Receipt         },
          { title: "Bursaries",          url: `/school/${slug}/finance/fees/bursaries`,      icon: BadgeDollarSign },
          { title: "Installment Plans",  url: `/school/${slug}/finance/fees/installments`,   icon: Banknote        },
          { title: "Penalty Rules",      url: `/school/${slug}/finance/fees/penalties`,      icon: ShieldCheck     },
          { title: "Auto-Invoice Config",url: `/school/${slug}/finance/fees/config`,         icon: Settings2       },
          { title: "Reports",            url: `/school/${slug}/finance/fees/reports`,        icon: BarChart3       },
        ],
      },
      {
        title: "Staff & Payroll",
        url: `/school/${slug}/finance/staff`,
        icon: UserCog,
        items: [
          { title: "Staff Management",   url: `/school/${slug}/staff` },
          { title: "Payroll Management", url: `/school/${slug}/staff/payroll` },
          { title: "Leave Management",   url: `/school/${slug}/staff/leave` },
          { title: "Training",           url: `/school/${slug}/staff/training` },
          { title: "Staff Attendance",   url: `/school/${slug}/staff/attendance` },
          { title: "Notice Board",       url: `/school/${slug}/staff/notice-board` },
          { title: "Staff Offboarding",  url: `/school/${slug}/staff/offboarding` },
        ],
      },
      {
        title: "Expenses & Inventory",
        url: `/school/${slug}/finance/expense`,
        icon: Building2,
        items: [
          { title: "Expense Records", url: `/school/${slug}/finance/expense` },
          { title: "Vendors",         url: `/school/${slug}/finance/expense/vendors` },
          { title: "Categories",      url: `/school/${slug}/finance/expense/categories` },
          { title: "Inventory",       url: `/school/${slug}/finance/inventory` },
        ],
      },
    ],
  },

  // ── SYSTEM ───────────────────────────────────────────────────────────────
  {
    groupLabel: "System",
    items: [
      {
        title: "Communication",
        url: `/school/${slug}/communication`,
        icon: Mail,
        items: [
          { title: "Messages", url: `/school/${slug}/communication/messages` },
          { title: "Events",   url: `/school/${slug}/communication/events` },
          { title: "Inbox",   url: `/school/${slug}/communication/inbox` },
          { title: "Notifications",   url: `/school/${slug}/communication/notifications` },
        ],
      },
      {
        title: "Settings",
        url: `/school/${slug}/settings`,
        icon: Settings2,
        items: [
          { title: "School Profile", url: `/school/${slug}/settings/profile` },
          { title: "Appearance",     url: `/school/${slug}/settings/appearance` },
        ],
      },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SchoolSidebar({
  session,
  school,
}: {
  session: any;
  school: any;
}) {
  const router = useRouter();
  const role: string = session?.roles?.[0]?.roleName ?? "";
  const isDOS     = role === "dos" || role === "director_of_studies";
  const navGroups = isDOS ? getDOSGroups(school.slug) : getSidebarGroups(school.slug);

  async function handleLogout() {
    try {
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      router.push("/login");
    }
  }

  const initials = (session?.name ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <SidebarHeader className="border-b border-slate-200 dark:border-slate-700/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              tooltip={school.name}
            >
              <div className="flex items-center justify-center bg-primary rounded-md p-1.5 text-primary-foreground">
                <Image
                  src={school.logo || "/placeholder.svg"}
                  width={24}
                  alt={school.name}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {school.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isDOS ? "DOS Portal" : "School Admin"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      <SidebarContent className="py-2">
        {navGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex} className="py-1">

            {group.groupLabel && (
              <SidebarGroupLabel className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.groupLabel}
              </SidebarGroupLabel>
            )}

            <SidebarMenu className="gap-1">
              {group.items.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="hover:bg-primary/10 dark:hover:bg-primary/15 data-[state=open]:bg-primary/10 dark:data-[state=open]:bg-primary/15 transition-colors rounded-lg"
                      >
                        <div className="flex items-center justify-center w-5 h-5 text-slate-600 dark:text-slate-400 group-data-[state=open]/collapsible:text-primary dark:group-data-[state=open]/collapsible:text-primary">
                          {item.icon && <item.icon className="w-5 h-5" />}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300 group-data-[state=open]/collapsible:text-primary dark:group-data-[state=open]/collapsible:text-primary">
                          {item.title}
                        </span>
                        <ChevronRight className="ml-auto w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-primary dark:group-data-[state=open]/collapsible:text-primary" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-1">
                      <SidebarMenuSub className="gap-0.5 border-l border-slate-200 dark:border-slate-700 ml-3">
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className="rounded-md hover:bg-primary/10 dark:hover:bg-primary/15 transition-colors text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary pl-4 h-8 gap-2"
                            >
                              <Link href={subItem.url} className="flex items-center gap-2">
                                {subItem.icon && (
                                  <subItem.icon className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                                )}
                                <span className="text-xs font-medium">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-950 p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={session?.image ?? ""} alt={session?.name ?? ""} />
            <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate leading-tight">
              {session?.name ?? session?.email ?? "User"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate leading-tight capitalize">
              {isDOS ? "Director of Studies" : role || "Admin"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="group-data-[collapsible=icon]:hidden ml-auto p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}