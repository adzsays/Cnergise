import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Trash2, Plus } from "lucide-react";

type KB = { id: string; title: string; content: string; enabled: boolean; sort_order: number };

export const VisitorChatManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getSetting, upsertSetting, isLoading: settingsLoading } = useSystemSettings();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!settingsLoading) setEnabled(getSetting("visitor_chat_enabled") === "true");
  }, [settingsLoading, getSetting]);

  const toggle = (v: boolean) => {
    setEnabled(v);
    upsertSetting.mutate({ key: "visitor_chat_enabled", value: String(v) });
  };

  const { data: items = [] } = useQuery({
    queryKey: ["vck"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitor_chat_knowledge")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as KB[];
    },
  });

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("visitor_chat_knowledge")
        .insert({ title: newTitle, content: newContent, sort_order: items.length });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTitle(""); setNewContent("");
      qc.invalidateQueries({ queryKey: ["vck"] });
      toast({ title: "Knowledge entry added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateItem = useMutation({
    mutationFn: async (item: Partial<KB> & { id: string }) => {
      const { error } = await supabase
        .from("visitor_chat_knowledge")
        .update(item)
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vck"] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visitor_chat_knowledge").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vck"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor AI Chat</CardTitle>
        <CardDescription>
          Toggle the public chat widget and manage the knowledge base the AI uses to respond.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label className="text-base">Enable visitor chat widget</Label>
            <p className="text-sm text-muted-foreground">Hidden during beta. Turn on when ready.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Knowledge base</h3>
          <p className="text-sm text-muted-foreground">
            Each entry is fed to the AI as context. Add facts about pricing, features, integrations, FAQs, etc.
          </p>

          {items.map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Input
                  defaultValue={item.title}
                  onBlur={(e) => e.target.value !== item.title && updateItem.mutate({ id: item.id, title: e.target.value })}
                  className="font-medium"
                />
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(v) => updateItem.mutate({ id: item.id, enabled: v })}
                />
                <Button size="icon" variant="ghost" onClick={() => deleteItem.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                defaultValue={item.content}
                rows={3}
                onBlur={(e) => e.target.value !== item.content && updateItem.mutate({ id: item.id, content: e.target.value })}
              />
            </div>
          ))}

          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <Input
              placeholder="Title (e.g. Pricing)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Content the AI should know..."
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <Button
              onClick={() => addItem.mutate()}
              disabled={!newTitle.trim() || !newContent.trim() || addItem.isPending}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" /> Add entry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
