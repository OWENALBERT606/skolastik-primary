// // // "use client";
// // // import React from "react";
// // // import Link from "next/link";
// // // import { Menu } from "lucide-react";
// // // import { Button } from "@/components/ui/button";
// // // import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// // // import { Session } from "next-auth";
// // // import { AvatarMenuButton } from "./AvatarMenuButton";
// // // import Logo from "../global/Logo";
// // // import { cn } from "@/lib/utils";
// // // import { usePathname, useRouter } from "next/navigation";
// // // import { signOut } from "next-auth/react";
// // // import { sidebarLinks } from "@/config/sidebar";
// // // import { usePermission } from "@/hooks/usePermissions";
// // // import { UserDropdownMenu } from "../UserDropdownMenu";

// // // export default function Navbar({ session }: { session: Session }) {
// // //   const router = useRouter();
// // //   const pathname = usePathname();
// // //   const { hasPermission } = usePermission();

// // //   // Filter sidebar links based on user permissions
// // //   const filteredLinks = sidebarLinks.filter((link) => {
// // //     // Check main link permission
// // //     if (!hasPermission(link.permission)) {
// // //       return false;
// // //     }

// // //     // If it's a dropdown, check if user has permission for any dropdown item
// // //     if (link.dropdown && link.dropdownMenu) {
// // //       return link.dropdownMenu.some((item) => hasPermission(item.permission));
// // //     }

// // //     return true;
// // //   });

// // //   // Flatten dropdown menus for mobile view
// // //   const mobileLinks = filteredLinks.reduce(
// // //     (acc, link) => {
// // //       // Add main link if it's not a dropdown
// // //       if (!link.dropdown) {
// // //         acc.push({
// // //           title: link.title,
// // //           href: link.href || "#",
// // //           icon: link.icon,
// // //           permission: link.permission,
// // //         });
// // //         return acc;
// // //       }

// // //       // Add dropdown items if user has permission
// // //       if (link.dropdownMenu) {
// // //         link.dropdownMenu.forEach((item) => {
// // //           if (hasPermission(item.permission)) {
// // //             acc.push({
// // //               title: item.title,
// // //               href: item.href,
// // //               icon: link.icon,
// // //               permission: item.permission,
// // //             });
// // //           }
// // //         });
// // //       }

// // //       return acc;
// // //     },
// // //     [] as Array<{ title: string; href: string; icon: any; permission: string }>
// // //   );

// // //   async function handleLogout() {
// // //     try {
// // //       await signOut();
// // //       router.push("/login");
// // //     } catch (error) {
// // //       console.log(error);
// // //     }
// // //   }

// // //   return (
// // //     <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-muted/60 px-4 lg:h-[60px] lg:px-6">
// // //       <Sheet>
// // //         <SheetTrigger asChild>
// // //           <Button variant="outline" size="icon" className="shrink-0 md:hidden">
// // //             <Menu className="h-5 w-5" />
// // //             <span className="sr-only">Toggle navigation menu</span>
// // //           </Button>
// // //         </SheetTrigger>
// // //         <SheetContent side="left" className="flex flex-col">
// // //           <nav className="grid gap-2 text-lg font-medium">
// // //             <Logo href="/dashboard" full={false} />

// // //             {/* Render mobile navigation links */}
// // //             {mobileLinks.map((item, i) => {
// // //               const Icon = item.icon;
// // //               const isActive = item.href === pathname;

// // //               return (
// // //                 <Link
// // //                   key={i}
// // //                   href={item.href}
// // //                   className={cn(
// // //                     "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
// // //                     isActive && "bg-muted text-primary"
// // //                   )}
// // //                 >
// // //                   <Icon className="h-4 w-4" />
// // //                   {item.title}
// // //                 </Link>
// // //               );
// // //             })}
// // //           </nav>

// // //           <div className="mt-auto">
// // //             <Button onClick={handleLogout} size="sm" className="w-full">
// // //               Logout
// // //             </Button>
// // //           </div>
// // //         </SheetContent>
// // //       </Sheet>

// // //       <div className="w-full flex-1"></div>
// // //       <div className="p-4 ">
// // //         <UserDropdownMenu
// // //           username={session?.user?.name ?? ""}
// // //           email={session?.user?.email ?? ""}
// // //           avatarUrl={
// // //             session?.user?.image ??
// // //             "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%20(54)-NX3G1KANQ2p4Gupgnvn94OQKsGYzyU.png"
// // //           }
// // //         />
// // //       </div>
// // //       {/* <AvatarMenuButton session={session} /> */}
// // //     </header>
// // //   );
// // // }



// // "use client"

// // import React from 'react'
// // import { Input } from "@/components/ui/input";
// // import {
// //   AudioWaveform,
// //   BadgeCheck,
// //   Bell,
// //   BookOpen,
// //   Bot,
// //   ChevronsUpDown,
// //   Command,
// //   CreditCard,
// //   Frame,
// //   GalleryVerticalEnd,
// //   LogOut,
// //   Map,
// //   PieChart,
// //   Plus,
// //   Settings2,
// //   Sparkles,
// //   SquareTerminal
// // } from "lucide-react";

// // import {
// //     DropdownMenu,
// //     DropdownMenuContent,
// //     DropdownMenuGroup,
// //     DropdownMenuItem,
// //     DropdownMenuLabel,
// //     DropdownMenuSeparator,
// //     DropdownMenuTrigger,
// // } from "@/components/ui/dropdown-menu"
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


// // const data = {
// //     user: {
// //         name: "shadcn",
// //         email: "m@example.com",
// //         avatar: "/avatars/shadcn.jpg",
// //     },
// //     teams: [
// //         {
// //             name: "Acme Inc",
// //             logo: GalleryVerticalEnd,
// //             plan: "Enterprise",
// //         },
// //         {
// //             name: "Acme Corp.",
// //             logo: AudioWaveform,
// //             plan: "Startup",
// //         },
// //         {
// //             name: "Evil Corp.",
// //             logo: Command,
// //             plan: "Free",
// //         },
// //     ],
// //     navMain: [
// //         {
// //             title: "Playground",
// //             url: "#",
// //             icon: SquareTerminal,
// //             isActive: true,
// //             items: [
// //                 {
// //                     title: "History",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Starred",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Settings",
// //                     url: "#",
// //                 },
// //             ],
// //         },
// //         {
// //             title: "Models",
// //             url: "#",
// //             icon: Bot,
// //             items: [
// //                 {
// //                     title: "Genesis",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Explorer",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Quantum",
// //                     url: "#",
// //                 },
// //             ],
// //         },
// //         {
// //             title: "Documentation",
// //             url: "#",
// //             icon: BookOpen,
// //             items: [
// //                 {
// //                     title: "Introduction",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Get Started",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Tutorials",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Changelog",
// //                     url: "#",
// //                 },
// //             ],
// //         },
// //         {
// //             title: "Settings",
// //             url: "#",
// //             icon: Settings2,
// //             items: [
// //                 {
// //                     title: "General",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Team",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Billing",
// //                     url: "#",
// //                 },
// //                 {
// //                     title: "Limits",
// //                     url: "#",
// //                 },
// //             ],
// //         },
// //     ],
// //     projects: [
// //         {
// //             name: "Design Engineering",
// //             url: "#",
// //             icon: Frame,
// //         },
// //         {
// //             name: "Sales & Marketing",
// //             url: "#",
// //             icon: PieChart,
// //         },
// //         {
// //             name: "Travel",
// //             url: "#",
// //             icon: Map,
// //         },
// //     ],
// // }

// // import { Button } from "@/components/ui/button";

// // import {
// //   SidebarFooter,
// //   SidebarMenu,
// //   SidebarMenuButton,
// //   SidebarMenuItem,
// //   SidebarTrigger,
// // } from "@/components/ui/sidebar";
// // import { ThemeToggle } from '../theme-toggle';


// // export default function NavBar({session}:{session:any}) {
// //     const [searchQuery, setSearchQuery] = React.useState("");
// //   return (
// //     <div className="flex h-16 items-center gap-4 border-b px-4">
// //               <SidebarTrigger />
// //               <div className="flex-1">
// //                 <Input
// //                   placeholder="Search products..."
// //                   value={searchQuery}
// //                   onChange={(e) => setSearchQuery(e.target.value)}
// //                   className="max-w-sm"
// //                 />
// //               </div>
// //               <ThemeToggle/>
// //               <Button variant="outline" size="icon">
// //                 <Plus className="h-5 w-5" />
// //                 <span className="sr-only">Add new</span>
// //               </Button>
// //               <SidebarFooter>
// //                         <SidebarMenu>
// //                           <SidebarMenuItem>
// //                             <DropdownMenu>
// //                               <DropdownMenuTrigger asChild>
// //                                 <SidebarMenuButton
// //                                   size="lg"
// //                                   className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
// //                                 >
// //                                   <Avatar className="h-8 w-8 rounded-lg">
// //                                     <AvatarImage
// //                                       src={data.user.avatar}
// //                                       alt={data.user.name}
// //                                     />
// //                                     <AvatarFallback className="rounded-lg">CN</AvatarFallback>
// //                                   </Avatar>
// //                                   <div className="grid flex-1 text-left text-sm leading-tight">
// //                                     <span className="truncate font-semibold">
// //                                       {data.user.name}
// //                                     </span>
// //                                     <span className="truncate text-xs">
// //                                       {data.user.email}
// //                                     </span>
// //                                   </div>
// //                                   <ChevronsUpDown className="ml-auto size-4" />
// //                                 </SidebarMenuButton>
// //                               </DropdownMenuTrigger>
// //                               <DropdownMenuContent
// //                                 className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
// //                                 side="bottom"
// //                                 align="end"
// //                                 sideOffset={4}
// //                               >
// //                                 <DropdownMenuLabel className="p-0 font-normal">
// //                                   <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
// //                                     <Avatar className="h-8 w-8 rounded-lg">
// //                                       <AvatarImage
// //                                         src={data.user.avatar}
// //                                         alt={data.user.name}
// //                                       />
// //                                       <AvatarFallback className="rounded-lg">
// //                                         CN
// //                                       </AvatarFallback>
// //                                     </Avatar>
// //                                     <div className="grid flex-1 text-left text-sm leading-tight">
// //                                       <span className="truncate font-semibold">
// //                                         {data.user.name}
// //                                       </span>
// //                                       <span className="truncate text-xs">
// //                                         {data.user.email}
// //                                       </span>
// //                                     </div>
// //                                   </div>
// //                                 </DropdownMenuLabel>
// //                                 <DropdownMenuSeparator />
// //                                 <DropdownMenuGroup>
// //                                   <DropdownMenuItem>
// //                                     <Sparkles />
// //                                     Upgrade to Pro
// //                                   </DropdownMenuItem>
// //                                 </DropdownMenuGroup>
// //                                 <DropdownMenuSeparator />
// //                                 <DropdownMenuGroup>
// //                                   <DropdownMenuItem>
// //                                     <BadgeCheck />
// //                                     Account
// //                                   </DropdownMenuItem>
// //                                   <DropdownMenuItem>
// //                                     <CreditCard />
// //                                     Billing
// //                                   </DropdownMenuItem>
// //                                   <DropdownMenuItem>
// //                                     <Bell/>
// //                                     Notifications
// //                                   </DropdownMenuItem>
// //                                 </DropdownMenuGroup>
// //                                 <DropdownMenuSeparator />
// //                                 <DropdownMenuItem>
// //                                   <LogOut />
// //                                   Log out
// //                                 </DropdownMenuItem>
// //                               </DropdownMenuContent>
// //                             </DropdownMenu>
// //                           </SidebarMenuItem>
// //                         </SidebarMenu>
// //                       </SidebarFooter>
// //             </div>
// //   )
// // }



// "use client"

// import React from "react"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { SidebarTrigger, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
// import { ThemeToggle } from "../theme-toggle"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Plus, ChevronsUpDown, LogOut, Bell, CreditCard, BadgeCheck, Sparkles } from "lucide-react"

// export default function NavBar({ session }: { session: any }) {
//   const [searchQuery, setSearchQuery] = React.useState("")

//   return (
//     <header
//       className="
//         flex h-16 items-center gap-4 px-4
//         border-b
//         bg-background
//         text-foreground
//         dark:border-slate-800
//       "
//     >
//       <SidebarTrigger />

//       {/* Search */}
//       <div className="flex-1">
//         <Input
//           placeholder="Search products..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="
//             max-w-sm
//             bg-background
//             border-border
//             dark:bg-slate-900
//             dark:border-slate-700
//           "
//         />
//       </div>

//       {/* Theme toggle */}
//       <ThemeToggle />

//       {/* Action button */}
//       <Button
//         variant="outline"
//         size="icon"
//         className="dark:border-slate-700 dark:hover:bg-slate-800"
//       >
//         <Plus className="h-5 w-5" />
//       </Button>

//       {/* User menu */}
//       <SidebarFooter>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <SidebarMenuButton
//                   size="lg"
//                   className="
//                     rounded-lg
//                     hover:bg-muted
//                     dark:hover:bg-slate-800
//                     data-[state=open]:bg-muted
//                     dark:data-[state=open]:bg-slate-800
//                   "
//                 >
//                   <Avatar className="h-8 w-8 rounded-lg">
//                     <AvatarImage src={session?.user?.image} />
//                     <AvatarFallback>U</AvatarFallback>
//                   </Avatar>

//                   <div className="grid flex-1 text-left text-sm">
//                     <span className="font-semibold truncate">
//                       {session?.user?.name}
//                     </span>
//                     <span className="text-xs text-muted-foreground truncate">
//                       {session?.user?.email}
//                     </span>
//                   </div>

//                   <ChevronsUpDown className="ml-auto size-4" />
//                 </SidebarMenuButton>
//               </DropdownMenuTrigger>

//               <DropdownMenuContent
//                 align="end"
//                 sideOffset={4}
//                 className="
//                   rounded-lg
//                   bg-background
//                   border-border
//                   dark:bg-slate-900
//                   dark:border-slate-700
//                 "
//               >
//                 <DropdownMenuLabel className="font-normal">
//                   Account
//                 </DropdownMenuLabel>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuGroup>
//                   <DropdownMenuItem>
//                     <Sparkles /> Upgrade
//                   </DropdownMenuItem>
//                   <DropdownMenuItem>
//                     <BadgeCheck /> Account
//                   </DropdownMenuItem>
//                   <DropdownMenuItem>
//                     <CreditCard /> Billing
//                   </DropdownMenuItem>
//                   <DropdownMenuItem>
//                     <Bell /> Notifications
//                   </DropdownMenuItem>
//                 </DropdownMenuGroup>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuItem className="text-red-600 dark:text-red-400">
//                   <LogOut /> Logout
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarFooter>
//     </header>
//   )
// }






"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  SidebarTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "../theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  ChevronsUpDown,
  LogOut,
  Bell,
  BadgeCheck,
  Search,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { AuthenticatedUser } from "@/config/useAuth"

export default function NavBar({ user }: { user: AuthenticatedUser }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")

  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name ?? "User"

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase()

  const roleName = user.roles?.[0]?.roleName ?? null

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <header className="flex h-16 items-center gap-3 px-4 border-b bg-background text-foreground dark:border-slate-800 sticky top-0 z-10">
      <SidebarTrigger />

      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm pl-9 bg-background border-border dark:bg-slate-900 dark:border-slate-700"
        />
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Quick add */}
      <Button
        variant="outline"
        size="icon"
        className="dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Add new</span>
      </Button>

      {/* User menu */}
      <SidebarFooter className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-lg hover:bg-muted dark:hover:bg-slate-800 data-[state=open]:bg-muted dark:data-[state=open]:bg-slate-800"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} alt={fullName} />
                    <AvatarFallback className="rounded-lg bg-[#5B9BD5]/20 text-[#5B9BD5] text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="font-semibold truncate">{fullName}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {roleName ?? user.email ?? ""}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={4}
                className="w-56 rounded-lg bg-background border-border dark:bg-slate-900 dark:border-slate-700"
              >
                {/* User info header */}
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="rounded-lg bg-[#5B9BD5]/20 text-[#5B9BD5] text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid text-left text-sm leading-tight">
                      <span className="font-semibold truncate">{fullName}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email ?? ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </header>
  )
}