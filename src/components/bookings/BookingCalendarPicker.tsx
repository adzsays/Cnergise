import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface Sub {
  google_calendar_id: string;
  summary: string | null;
  is_primary: boolean;
}

export function BookingCalendarPicker() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase
          .from("google_calendar_subscriptions")
          .select("google_calendar_id, summary, is_primary")
          .eq("user_id", user.id)
          .eq("enabled", true)
          .order("is_primary", { ascending: false })
          .order("summary", { ascending: true }),
        supabase.from("profiles").select("booking_calendar_id").eq("id", user.id).maybeSingle(),
      ]);
      setSubs((s as Sub[]) || []);
      const primary = (s as Sub[] | null)?.find((x) => x.is_primary)?.google_calendar_id;
      setValue((p?.booking_calendar_id as string) || primary || "primary");
      setLoading(false);
    })();
  }, []);

  const onChange = async (next: string) => {
    setValue(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ booking_calendar_id: next }).eq("id", user.id);
    if (error) {
      toast.error("Couldn't save calendar choice");
      return;
    }
    toast.success("Booking calendar updated");
  };

  if (loading) return null;
  if (subs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1 px-2">
        <Calendar className="h-3.5 w-3.5" /> Connect Google Calendar to choose
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[220px]">
        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
        <SelectValue placeholder="Booking calendar" />
      </SelectTrigger>
      <SelectContent>
        {subs.map((s) => (
          <SelectItem key={s.google_calendar_id} value={s.google_calendar_id}>
            {s.summary || s.google_calendar_id}{s.is_primary ? " (primary)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
