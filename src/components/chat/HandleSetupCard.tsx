import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AtSign, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  currentHandle: string | null;
  onSaved: () => void;
}

export function HandleSetupCard({ currentHandle, onSaved }: Props) {
  const [handle, setHandle] = useState(currentHandle ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setHandle(currentHandle ?? ""); }, [currentHandle]);

  const save = async () => {
    const clean = handle.replace(/^@/, "").toLowerCase().trim();
    if (!/^[a-z0-9_]{3,24}$/.test(clean)) {
      toast.error("Handle must be 3-24 chars: a-z, 0-9, _");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ handle: clean })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        toast.error("That handle is already taken");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(`@${clean} is now your Cnergise ID`);
    onSaved();
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Claim your Cnergise ID</CardTitle>
        </div>
        <CardDescription>
          One handle. Chat in-app, share with anyone, no email/phone needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor="handle" className="text-xs">Your @handle</Label>
        <div className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="handle"
              value={handle.replace(/^@/, "")}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourname"
              className="pl-8"
              maxLength={24}
            />
          </div>
          <Button onClick={save} disabled={saving}>
            {currentHandle ? "Update" : "Claim"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          3–24 characters · lowercase letters, numbers, underscore
        </p>
      </CardContent>
    </Card>
  );
}
