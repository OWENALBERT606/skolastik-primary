// config/sidebar.ts
import {
  Home,
  School,
  Users,
  Settings,
  BarChart3,
  UserCheck,
  Bell,
  LucideIcon,
  KeyRound,
  Globe,
  CreditCard,
} from "lucide-react";

export interface ISidebarLink {
  title:       string;
  href?:       string;
  icon:        LucideIcon;
  dropdown:    boolean;
  permission:  string;
  dropdownMenu?: MenuItem[];
}

type MenuItem = {
  title:      string;
  href:       string;
  permission: string;
};

export const sidebarLinks: ISidebarLink[] = [
  {
    title:      "Dashboard",
    href:       "/dashboard",
    icon:       Home,
    dropdown:   false,
    permission: "dashboard.read",
  },
  {
    title:      "Schools",
    href:       "/dashboard/schools",
    icon:       School,
    dropdown:   false,
    permission: "schools.read",
  },
  {
    title:      "Users",
    icon:       Users,
    dropdown:   true,
    permission: "users.read",
    dropdownMenu: [
      { title: "All Users",        href: "/dashboard/users",         permission: "users.read"  },
      { title: "Roles",            href: "/dashboard/users/roles",   permission: "roles.read"  },
    ],
  },
  {
    title:      "Payments & Revenue",
    href:       "/dashboard/payments",
    icon:       CreditCard,
    dropdown:   false,
    permission: "dashboard.read",
  },
  {
    title:      "Settings",
    href:       "/dashboard/settings",
    icon:       Settings,
    dropdown:   false,
    permission: "settings.read",
  },
  {
    title:      "Change Password",
    href:       "/dashboard/change-password",
    icon:       KeyRound,
    dropdown:   false,
    permission: "dashboard.read",
  },
];
