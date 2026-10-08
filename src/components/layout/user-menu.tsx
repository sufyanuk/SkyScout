"use client";

import Link from "next/link";
import { useTransition } from "react";
import { BellRing, Heart, LayoutDashboard, LogOut, History } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user }: UserMenuProps) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        aria-label="Open account menu"
      >
        <Avatar>
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="font-semibold">{user.name ?? "Traveller"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favorites">
            <Heart /> Saved flights
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/alerts">
            <BellRing /> Price alerts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard#history">
            <History /> Search history
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={() => startTransition(() => logoutAction())}>
          <LogOut /> {pending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
