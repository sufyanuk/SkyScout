import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { oauthProviders } from "@/auth";
import { LoginForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

function safe(url: unknown) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const callbackUrl = safe((await searchParams).callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);
  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your saved flights, alerts and search history.">
      <OAuthButtons providers={oauthProviders} callbackUrl={callbackUrl} />
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
