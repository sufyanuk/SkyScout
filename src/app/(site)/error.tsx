"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudLightning, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-sunrise-soft text-sunrise">
        <CloudLightning className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">We hit some turbulence</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Something went wrong loading this page. It&apos;s usually temporary — try again, or head back to the homepage.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>
          <RotateCcw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
