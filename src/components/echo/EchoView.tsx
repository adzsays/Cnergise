import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Mic,
  Loader2,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Utensils,
  Dumbbell,
  Star,
  Tag,
  MessageCircle,
  BarChart3,
  Pencil,
  Check,
  Trash2,
} from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EchoCoach from "@/components/echo/EchoCoach";
import EchoStats from "@/components/echo/EchoStats";

type EchoEntry = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  amount: number | null;
  unit: string | null;
  goal_id: string | null;
  project_id: string | null;
  task_id: string | null;
  raw_voice_text: string | null;
  entry_date: string;
  entry_time: string | null;
  created_at: string;
};

type Goal = { id: string; title: string; category: string; status: string };
type ProjectLite = { id: string; name: string; goal_id: string | null };
type TaskLite = { id: string; title: string; project_id: string | null };

const iconMap: Record<string, typeof DollarSign> = {
  spending: DollarSign,
  finance: DollarSign,
  food: Utensils,
  exercise: Dumbbell,
  fitness: Dumbbell,
  health: Dumbbell,
  wellness: Dumbbell,
  events: Star,
  career: Star,
  learning: Star,
  social: Star,
  productivity: Star,
};

const colorMap: Record<string, string> = {
  spending: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  finance: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  food: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  exercise: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  fitness: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  health: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  wellness: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  events: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  career: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  learning: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  social: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  productivity: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function EchoView() {
  const { format: formatCurrency } = useUserCurrency();
  const [entries, setEntries] = useState<EchoEntry[]>([]);
  const [allEntries, setAllEntries] = useState<EchoEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState({ title: "", description: "", amount: "", unit: "" });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("echo_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", selectedDate)
      .order("created_at", { ascending: false });
    setEntries((data as EchoEntry[]) || []);
    setLoading(false);
  }, [selectedDate]);

  const fetchAllEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("echo_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000);
    setAllEntries((data as EchoEntry[]) || []);
  }, []);

  const fetchGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select("id, title, category, status")
      .eq("user_id", user.id)
      .eq("status", "active");
    setGoals((data as Goal[]) || []);
  }, []);

  const fetchPlanContext = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: pData }, { data: tData }] = await Promise.all([
      supabase.from("projects").select("id, name, goal_id").eq("user_id", user.id).neq("status", "archived"),
      supabase.from("tasks").select("id, title, project_id").eq("user_id", user.id).neq("status", "done").limit(200),
    ]);
    setProjects((pData as ProjectLite[]) || []);
    setTasks((tData as TaskLite[]) || []);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchAllEntries(); fetchGoals(); fetchPlanContext(); }, [fetchAllEntries, fetchGoals, fetchPlanContext]);

  useEffect(() => {
    const handler = () => { fetchEntries(); fetchAllEntries(); };
    window.addEventListener("echo:entries-updated", handler);
    return () => window.removeEventListener("echo:entries-updated", handler);
  }, [fetchEntries, fetchAllEntries]);

  const goToday = () => setSelectedDate(new Date().toISOString().split("T")[0]);
  const goPrev = () =>
    setSelectedDate(format(subDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd"));
  const goNext = () =>
    setSelectedDate(format(addDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd"));
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const classifyAndSave = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsProcessing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");

        const { data, error } = await supabase.functions.invoke("echo-classify-entry", {
          body: { text: text.trim(), goals, projects, tasks },
        });
        if (error) throw error;
        const classified = data?.entries || [];
        if (classified.length === 0) {
          toast.info("Nothing to log from that text");
          return;
        }
        for (const entry of classified) {
          const { error: insertError } = await supabase.from("echo_entries").insert({
            user_id: user.id,
            type: entry.type,
            title: entry.title,
            description: entry.description,
            amount: entry.amount ?? null,
            unit: entry.unit ?? null,
            goal_id: entry.goal_id || null,
            project_id: entry.project_id || null,
            task_id: entry.task_id || null,
            raw_voice_text: text.trim(),
            entry_date: selectedDate,
            entry_time: new Date().toLocaleTimeString("en-GB", {
              hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
            }),
          });
          if (insertError) throw insertError;
        }
        toast.success(`${classified.length} ${classified.length === 1 ? "entry" : "entries"} logged`);
        setManualText("");
        fetchEntries();
        fetchAllEntries();
      } catch (e: any) {
        console.error(e);
        toast.error(e.message ?? "Failed to log");
      } finally {
        setIsProcessing(false);
      }
    },
    [goals, projects, tasks, selectedDate, fetchEntries, fetchAllEntries]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (manualText.trim() && !isProcessing) classifyAndSave(manualText);
  };

  const handleAutoCorrect = async () => {
    if (!manualText.trim() || isAutoCorrecting) return;
    setIsAutoCorrecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("echo-classify-entry", {
        body: { text: manualText.trim(), mode: "autocorrect" },
      });
      if (error) throw error;
      if (data?.corrected) {
        setManualText(data.corrected);
        toast.success("Auto-corrected");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Auto-correct failed");
    } finally {
      setIsAutoCorrecting(false);
    }
  };

  const startEdit = (e: EchoEntry) => {
    setEditingId(e.id);
    setEditState({
      title: e.title,
      description: e.description ?? "",
      amount: e.amount != null ? String(e.amount) : "",
      unit: e.unit ?? "",
    });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("echo_entries").update({
      title: editState.title,
      description: editState.description || null,
      amount: editState.amount ? parseFloat(editState.amount) : null,
      unit: editState.unit || null,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    setEditingId(null);
    fetchEntries();
    fetchAllEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("echo_entries").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    fetchEntries();
    fetchAllEntries();
  };

  const entryTypes = Array.from(new Set(entries.map((e) => e.type))).sort();
  const filteredEntries = typeFilter === "all" ? entries : entries.filter((e) => e.type === typeFilter);

  const formatTime = (t: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Echo Voice Journal</h1>
        <p className="text-sm text-muted-foreground">
          Speak or type what you did — AI auto-categorises spending, food, exercise, events and more.
        </p>
      </header>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-sm">
          <TabsTrigger value="log"><Mic className="w-3.5 h-3.5 mr-1.5" /> Log</TabsTrigger>
          <TabsTrigger value="coach"><MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Coach</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4 mt-4">
          {/* Quick text log — voice handled by the global floating mic (Echo mode) */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Quick log (or use the floating mic → Echo mode)</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-2">
              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder='"Spent £12 on lunch, ran 3 miles, had a team meeting"'
                disabled={isProcessing}
                className="min-h-[80px] resize-none text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                {manualText.trim() && (
                  <button
                    type="button"
                    onClick={handleAutoCorrect}
                    disabled={isProcessing || isAutoCorrecting}
                    className="h-8 px-3 rounded-md text-xs flex items-center gap-1 bg-secondary hover:bg-accent disabled:opacity-50"
                  >
                    {isAutoCorrecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Tidy
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!manualText.trim() || isProcessing}
                  className="h-8 px-3 rounded-md text-xs flex items-center gap-1 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Log
                </button>
              </div>
            </form>
          </Card>

          {/* Day Summary */}
          <DaySummary entries={entries} formatCurrency={formatCurrency} />

          {/* Date nav + filter */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goPrev} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <button onClick={goToday} className="text-sm font-medium hover:text-primary px-1">
                {isToday ? "Today" : format(parseISO(selectedDate), "EEE, MMM d")}
              </button>
              <Button variant="ghost" size="sm" onClick={goNext} disabled={isToday} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {entryTypes.length > 1 && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-auto h-7 text-xs gap-1 px-2">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {entryTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Entry list */}
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filteredEntries.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No entries for {format(parseISO(selectedDate), "MMMM d")}</p>
              <p className="text-xs text-muted-foreground mt-1">Use the voice recorder above to log your day</p>
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredEntries.map((entry, i) => {
                  const Icon = iconMap[entry.type] || Tag;
                  const colorClass = colorMap[entry.type] || "bg-muted text-muted-foreground";
                  const isEditing = editingId === entry.id;
                  const isSpend = entry.type === "spending" || entry.type === "finance";

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                              <Icon className="w-3 h-3" />
                              {entry.type}
                            </span>
                            {entry.entry_time && (
                              <span className="text-[10px] text-muted-foreground">{formatTime(entry.entry_time)}</span>
                            )}
                            {entry.goal_id && <Badge variant="outline" className="text-[10px] h-5">🎯 Goal</Badge>}
                            {entry.project_id && <Badge variant="outline" className="text-[10px] h-5">📁 Project</Badge>}
                            {entry.task_id && <Badge variant="outline" className="text-[10px] h-5">✓ Task</Badge>}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEdit(entry)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteEntry(entry.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Input value={editState.title} onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))} className="h-8 text-sm" />
                            <Textarea value={editState.description} onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))} className="min-h-[60px] text-sm resize-none" />
                            <div className="flex gap-2">
                              <Input value={editState.amount} onChange={(e) => setEditState((s) => ({ ...s, amount: e.target.value }))} placeholder="Amount" type="number" className="h-8 text-sm w-24" />
                              <Input value={editState.unit} onChange={(e) => setEditState((s) => ({ ...s, unit: e.target.value }))} placeholder="Unit" className="h-8 text-sm w-24" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 text-xs">Cancel</Button>
                              <Button size="sm" onClick={() => saveEdit(entry.id)} className="h-7 text-xs">
                                <Check className="w-3 h-3 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{entry.title}</p>
                              {entry.description && <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>}
                            </div>
                            {entry.amount != null && (
                              <span className="text-sm font-semibold whitespace-nowrap">
                                {isSpend ? formatCurrency(entry.amount) : `${entry.amount} ${entry.unit ?? ""}`}
                              </span>
                            )}
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coach" className="mt-4">
          <EchoCoach entries={entries} goals={goals} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <EchoStats entries={allEntries} formatCurrency={formatCurrency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DaySummary({
  entries, formatCurrency,
}: { entries: EchoEntry[]; formatCurrency: (n: number) => string }) {
  const spending = entries
    .filter((e) => e.type === "spending" || e.type === "finance")
    .reduce((s, e) => s + (e.amount || 0), 0);
  const meals = entries.filter((e) => e.type === "food").length;
  const exercises = entries.filter((e) => ["exercise", "fitness", "health", "wellness"].includes(e.type)).length;
  const events = entries.filter((e) => ["events", "social", "career"].includes(e.type)).length;

  const stats = [
    { label: "Spent", value: formatCurrency(spending), Icon: DollarSign, color: "text-red-500" },
    { label: "Meals", value: meals, Icon: Utensils, color: "text-amber-500" },
    { label: "Activities", value: exercises, Icon: Dumbbell, color: "text-emerald-500" },
    { label: "Events", value: events, Icon: Star, color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ label, value, Icon, color }) => (
        <Card key={label} className="p-3 text-center">
          <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
          <p className="text-base font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </Card>
      ))}
    </div>
  );
}
