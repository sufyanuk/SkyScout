"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction, type ProfileFormState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIRPORT_OPTIONS } from "@/lib/catalog/airports";

export function ProfileForm({ name, email, homeAirport }: { name: string; email: string; homeAirport: string }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfileAction, {});
  useEffect(() => {
    if (state.ok) toast.success("Profile saved");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" name="name" defaultValue={name} required aria-invalid={!!state.fields?.name} />
        {state.fields?.name && <p className="text-sm text-destructive">{state.fields.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-airport">Home airport</Label>
        <select
          id="profile-airport"
          name="homeAirport"
          defaultValue={homeAirport}
          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        >
          {AIRPORT_OPTIONS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.city} ({a.code})
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Save profile
      </Button>
    </form>
  );
}
