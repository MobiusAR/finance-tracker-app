import {
  LayoutDashboard,
  TrendingUp,
  HandCoins,
  Receipt,
  Shield,
  Tags,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: TrendingUp },
  { name: 'Loans', href: '/loans', icon: HandCoins },
  { name: 'Spending', href: '/spending', icon: Receipt },
  { name: 'Income & CPF', href: '/income', icon: Shield },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Subscriptions', href: '/subscriptions', icon: CalendarDays },
];

// Core tabs shown in the mobile bottom nav. Everything else lives in the
// "More" sheet to keep the bottom bar uncrowded.
export const mobileCoreNav: NavItem[] = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: TrendingUp },
  { name: 'Spend', href: '/spending', icon: Receipt },
  { name: 'Income', href: '/income', icon: Shield },
];

export const mobileMoreNav: NavItem[] = [
  { name: 'Loans', href: '/loans', icon: HandCoins },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Subscriptions', href: '/subscriptions', icon: CalendarDays },
];
