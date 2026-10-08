"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { checkAlertNow, toggleAlertPaused } from "@/actions/alerts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AlertActions({ alertId, status, label }: { alertId: string; status: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const check = () =>
    startTransition(async () => {
      const res = await checkAlertNow(alertId);
      if (!res.ok) return void toast.error(res.error);
      toast.success(
        res.status === "TRIGGERED" ? "Target reached — alert triggered!" : `Checked: cheapest is $${res.price ?? "—"}`,
      );
    });

  const toggle = (paused: boolean) =>
    startTransition(async () => {
      const res = await toggleAlertPaused(alertId, paused);
      if (!res.ok) return void toast.error("Couldn't update this alert");
      toast.success(paused ? "Alert paused" : res.status === "TRIGGERED" ? "Re-armed — and it matched again!" : "Alert re-armed");
    });

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Alert deleted");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't delete this alert");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" && (
        <>
          <Button size="sm" variant="secondary" onClick={check} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Check now
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggle(true)} disabled={pending}>
            <Pause /> Pause
          </Button>
        </>
      )}
      {(status === "PAUSED" || status === "TRIGGERED") && (
        <Button size="sm" variant="secondary" onClick={() => toggle(false)} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Play />} {status === "TRIGGERED" ? "Re-arm" : "Resume"}
        </Button>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 /> Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this alert?</DialogTitle>
            <DialogDescription>
              We&apos;ll stop watching {label}. It stays in your alert history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep it</Button>
            </DialogClose>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />} Delete alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
