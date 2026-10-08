import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { oauthProviders } from "@/auth";
import { SignupForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { getCurrentUser } from "@/lib/auth/session";
import { getHomeAirport } from "@/lib/services/preferences";

export const metadata: Metadata = { title: "Sign up", description: "Create a free SkyScout account to save deals and set price alerts." };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const raw = (await searchParams).callbackUrl;
  const callbackUrl = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  if (await getCurrentUser()) redirect(callbackUrl);
  return (
    <AuthShell title="Create your account" subtitle="Free forever. Save deals, set price alerts and get deals from your home airport.">
      <OAuthButtons providers={oauthProviders} callbackUrl={callbackUrl} />
      <SignupForm callbackUrl={callbackUrl} defaultAirport={await getHomeAirport()} />
    </AuthShell>
  );
}
