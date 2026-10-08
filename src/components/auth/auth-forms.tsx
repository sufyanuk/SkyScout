"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction, signupAction, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIRPORT_OPTIONS } from "@/lib/catalog/airports";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormError message={state.error} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          aria-invalid={!!state.fields?.email}
          aria-describedby={state.fields?.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={state.fields?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state.fields?.password}
          aria-describedby={state.fields?.password ? "password-error" : undefined}
        />
        <FieldError id="password-error" message={state.fields?.password} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Log in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New to SkyScout?{" "}
        <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ callbackUrl, defaultAirport }: { callbackUrl: string; defaultAirport: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signupAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormError message={state.error} />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required defaultValue={state.values?.name} aria-invalid={!!state.fields?.name} aria-describedby={state.fields?.name ? "name-error" : undefined} />
        <FieldError id="name-error" message={state.fields?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} aria-invalid={!!state.fields?.email} aria-describedby={state.fields?.email ? "email-error" : undefined} />
        <FieldError id="email-error" message={state.fields?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!state.fields?.password} aria-describedby="password-hint" />
        <p id="password-hint" className={state.fields?.password ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
          {state.fields?.password ?? "At least 8 characters, including a letter and a number."}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="homeAirport">Home airport</Label>
        <select
          id="homeAirport"
          name="homeAirport"
          defaultValue={state.values?.homeAirport || defaultAirport}
          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        >
          {AIRPORT_OPTIONS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.city} ({a.code})
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">We use it to personalise deals. You can change it any time.</p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Create account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
