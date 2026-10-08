import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-horizon px-6 text-center">
      <Logo />
      <p className="mt-12 font-mono text-sm font-semibold tracking-[0.3em] text-primary">ERROR 404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
        Off the <span className="font-display font-normal italic">map</span>.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        We couldn&apos;t find that page. It may have moved — or you&apos;ve discovered somewhere even we don&apos;t fly.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/explore">
            <Compass /> Explore destinations
          </Link>
        </Button>
      </div>
    </div>
  );
}
