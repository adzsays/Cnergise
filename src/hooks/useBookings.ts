import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type BookingEventType = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  location_type: "google_meet" | "in_person" | "phone" | "custom";
  location_details: string | null;
  color: string | null;
  timezone: string;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_advance_days: number;
  is_active: boolean;
};

export type AvailabilityRule = {
  id?: string;
  event_type_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type Booking = {
  id: string;
  event_type_id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_notes: string | null;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
  location_snapshot: string | null;
  cancel_token: string;
};

export function useEventTypes() {
  return useQuery({
    queryKey: ["booking-event-types"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as BookingEventType[];
      const { data, error } = await supabase
        .from("booking_event_types")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as BookingEventType[];
    },
  });
}

export function useUpsertEventType() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (et: Partial<BookingEventType> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const payload = { ...et, user_id: user.id };
      if (et.id) {
        const { error } = await supabase.from("booking_event_types").update(payload).eq("id", et.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("booking_event_types").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-event-types"] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteEventType() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("booking_event_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-event-types"] });
      toast({ title: "Deleted" });
    },
  });
}

export function useAvailability(eventTypeId: string | null) {
  return useQuery({
    enabled: !!eventTypeId,
    queryKey: ["booking-availability", eventTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_availability_rules")
        .select("*")
        .eq("event_type_id", eventTypeId!)
        .order("day_of_week");
      if (error) throw error;
      return (data ?? []) as AvailabilityRule[];
    },
  });
}

export function useReplaceAvailability() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ eventTypeId, rules }: { eventTypeId: string; rules: AvailabilityRule[] }) => {
      await supabase.from("booking_availability_rules").delete().eq("event_type_id", eventTypeId);
      if (rules.length === 0) return;
      const payload = rules.map((r) => ({
        event_type_id: eventTypeId,
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
      }));
      const { error } = await supabase.from("booking_availability_rules").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["booking-availability", v.eventTypeId] });
      toast({ title: "Availability saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as Booking[];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("host_user_id", user.id)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });
}

export function useUserHandle() {
  return useQuery({
    queryKey: ["my-handle"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("handle").eq("id", user.id).maybeSingle();
      return (data?.handle as string | null) ?? null;
    },
  });
}
