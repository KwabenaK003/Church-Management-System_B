import {
  CalendarCheck,
  ChartBar,
  ChartPieSlice,
  ChatCircleText,
  CurrencyDollar,
  Desktop,
  GearSix,
  Users,
  UsersFour,
  UsersThree,
} from "@phosphor-icons/react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export interface NavGroup {
  section: string;
  items: NavItem[];
}

export const ADMIN_NAVIGATION_GROUPED: NavGroup[] = [
  {
    section: "",
    items: [{ label: "Dashboard", href: "/dashboard", icon: ChartPieSlice }],
  },
  {
    section: "PEOPLE",
    items: [
      { label: "Members", href: "/dashboard/members", icon: Users },
      { label: "Visitors", href: "/dashboard/visitors", icon: UsersFour },
      {
        label: "Cluster Follow-up",
        href: "/dashboard/follow-up",
        icon: UsersThree,
      },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
      { label: "Finance", href: "/dashboard/finance", icon: CurrencyDollar },
      { label: "Equipment", href: "/dashboard/equipment", icon: Desktop },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [{ label: "Bulk SMS", href: "/dashboard/sms", icon: ChatCircleText }],
  },
  {
    section: "SYSTEM",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: ChartBar },
      { label: "Settings", href: "/dashboard/settings", icon: GearSix },
    ],
  },
];

// Keep backward-compatible flat list for any code that still uses it
export const ADMIN_NAVIGATION = ADMIN_NAVIGATION_GROUPED.flatMap(
  (group) => group.items
);