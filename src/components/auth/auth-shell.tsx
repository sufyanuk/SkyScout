import type { ReactNode } from "react";
import { BellRing, Heart, Sparkles } from "lucide-react";
import { DestinationArt } from "@/components/destinations/destination-art";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] items-center gap-12 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden rounded-[2rem] shadow-float lg:block">
        <div className="h-[560px]">
          <DestinationArt code="SKY" theme="island" from="#bae6fd" to="#1d4ed8" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <ul className="absolute right-8 bottom-8 left-8 space-y-3 text-white">
          {[
            { icon: Heart, text: "Save deals and watch their prices" },
            { icon: BellRing, text: "Get alerts when your route drops" },
            { icon: Sparkles, text: "Personalised deals from your airport" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 font-medium backdrop-blur">
              <Icon className="size-5" aria-hidden="true" /> {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
