"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";
import { setHomeAirportCookie } from "@/lib/services/preferences";

export interface AuthFormState {
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
}

/** Only allow same-site relative redirects (prevents open redirects). */
function safeCallback(value: FormDataEntryValue | null): string {
  const url = typeof value === "string" ? value : "";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard";
}

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const limit = rateLimit(await clientKey("login"), 10, 10 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeCallback(formData.get("callbackUrl")) });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: error.type === "CredentialsSignin" ? "That email and password don't match an account." : "Couldn't sign you in. Please try again.",
        values,
      };
    }
    throw error; // redirect after successful sign-in
  }
  return {};
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    homeAirport: formData.get("homeAirport") || undefined,
  };
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? ""), homeAirport: String(raw.homeAirport ?? "") };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const limit = rateLimit(await clientKey("signup"), 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: "Too many sign-ups from this network. Please try again later.", values };

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        homeAirport: parsed.data.homeAirport ?? "DOH",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fields: { email: "An account with this email already exists. Try logging in." }, values };
    }
    console.error("[signup]", error);
    return { error: "We couldn't create your account right now. Is the database running?", values };
  }

  if (parsed.data.homeAirport) await setHomeAirportCookie(parsed.data.homeAirport);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created — please log in.", values };
    throw error;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

/** Start an OAuth flow (only offered for providers configured in .env). */
export async function oauthSignInAction(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  if (!["google", "github"].includes(provider)) return;
  await signIn(provider, { redirectTo: safeCallback(formData.get("callbackUrl")) });
}
