import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

interface RequestInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestInviteDialog({ open, onOpenChange }: RequestInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setEmail(""); setFullName(""); setReason("");
    setSubmitted(false); setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("invite_requests").insert({
      email: email.trim().toLowerCase(),
      full_name: fullName.trim() || null,
      reason: reason.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      // unique-pending index → friendly message
      if (error.code === "23505") {
        toast.success("You already have a pending request — we'll be in touch.");
        setSubmitted(true);
        return;
      }
      toast.error(error.message ?? "Could not submit your request");
      return;
    }
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 200); }}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">Request received</DialogTitle>
              <DialogDescription className="text-center">
                Thanks — your invite request is in our queue. If approved, we'll email you a sign-in link.
                Cnergise is currently invite-only and we review requests personally.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Request an invite</DialogTitle>
              <DialogDescription>
                Cnergise is private beta. Tell us a little about you and we'll be in touch if approved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-reason">Why are you interested? <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  id="invite-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="A sentence or two helps us prioritise."
                  rows={3}
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> We only use your email to respond to this request.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
