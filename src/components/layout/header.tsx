import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getAirport } from "@/lib/catalog/airports";
import { getCurrency, getHomeAirport } from "@/lib/services/preferences";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { RegionSettings } from "./region-settings";
import { UserMenu } from "./user-menu";

export async function Header() {
  const user = await getCurrentUser();
  const [home, currency] = await Promise.all([getHomeAirport(), getCurrency()]);
  const countryCode = getAirport(home)?.countryCode ?? "QA";
  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-[0_1px_8px_rgb(15_27_61/0.06)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 lg:gap-6">
          <Logo />
          <NavLinks />
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <RegionSettings countryCode={countryCode} currency={currency} />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-9 px-2 sm:px-3">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="h-9 px-3 sm:px-4">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
