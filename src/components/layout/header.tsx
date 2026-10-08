import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
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
