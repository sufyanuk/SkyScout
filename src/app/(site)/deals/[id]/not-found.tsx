import Link from "next/link";
import { PlaneLanding } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function DealNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={PlaneLanding}
        title="This deal has flown away"
        description="Fares change quickly — this one is no longer available or the link is incomplete. Fresh deals are added every day."
        action={
          <>
            <Button asChild>
              <Link href="/deals">Browse today&apos;s deals</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/explore">Explore destinations</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
