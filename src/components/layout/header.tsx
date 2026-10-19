import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-[0_1px_8px_rgb(15_27_61/0.06)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-9">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="h-9 px-4">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
