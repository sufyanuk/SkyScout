import { BellRing, Compass, Heart, Home, MapPinned, Tag, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/destinations", label: "Destinations", icon: MapPinned },
  { href: "/alerts", label: "Price Alerts", icon: BellRing },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/favorites", label: "Saved", icon: Heart },
  { href: "/alerts", label: "Alerts", icon: BellRing },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
