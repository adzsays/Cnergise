import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useEnableFeature, type AppFeature } from "@/hooks/useFeatures";

interface Props {
  feature: AppFeature | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EnableFeatureDialog({ feature, open, onOpenChange }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [notes, setNotes] = useState("");
  const enable = useEnableFeature();

  if (!feature) return null;

  const handleSubmit = async () => {
    await enable.mutateAsync({ feature, notes: notes || undefined });
    setAccepted(false);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {feature.is_regulated ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
            Enable {feature.name}
          </DialogTitle>
          <DialogDescription>{feature.description}</DialogDescription>
        </DialogHeader>

        {feature.disclaimer && (
          <div className={`rounded-md border p-3 text-sm ${feature.is_regulated ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "bg-muted"}`}>
            <ScrollArea className="max-h-48 pr-2">
              <p className="whitespace-pre-line leading-relaxed">{feature.disclaimer}</p>
            </ScrollArea>
          </div>
        )}

        {feature.requires_approval && (
          <div className="rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-950/30 p-3 text-sm">
            <strong>Admin approval required.</strong> Because this is a regulated feature, your request will be reviewed before access is granted.
            <div className="mt-2">
              <Label htmlFor="notes" className="text-xs">Notes for reviewer (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 pt-2">
          <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
          <Label htmlFor="accept" className="text-sm leading-snug cursor-pointer">
            I have read and agree to the terms (v{feature.current_terms_version}) and disclaimer above for the {feature.name} feature.
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!accepted || enable.isPending}>
            {enable.isPending ? "Submitting..." : feature.requires_approval ? "Request Access" : "Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
