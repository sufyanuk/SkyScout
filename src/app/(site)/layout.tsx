import { CurrencyProvider } from "@/components/common/currency-provider";
import { ViewerProvider } from "@/components/common/viewer-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteDealIds } from "@/lib/services/favorites";
import { getCurrency } from "@/lib/services/preferences";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const currency = await getCurrency();
  const saved = user
    ? await getFavoriteDealIds(user.id).catch(() => new Set<string>())
    : new Set<string>();

  return (
    <CurrencyProvider currency={currency}>
      <ViewerProvider isAuthenticated={!!user} savedDealIds={[...saved]}>
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileNavigation />
        <Toaster />
      </ViewerProvider>
    </CurrencyProvider>
  );
}
