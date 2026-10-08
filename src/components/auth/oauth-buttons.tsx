import { oauthSignInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

/** Rendered only when AUTH_GOOGLE_* / AUTH_GITHUB_* credentials are configured. */
export function OAuthButtons({ providers, callbackUrl }: { providers: { id: string; name: string }[]; callbackUrl: string }) {
  if (providers.length === 0) return null;
  return (
    <div className="space-y-3">
      {providers.map((p) => (
        <form key={p.id} action={oauthSignInAction}>
          <input type="hidden" name="provider" value={p.id} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" size="lg" className="w-full">
            Continue with {p.name}
          </Button>
        </form>
      ))}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
