import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, X, Send, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Mode = "assistant" | "echo";

const MAX_RECORD_MS = 60_000;

// Browser SpeechRecognition (free, on-device — no AI billing)
function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceAssistant() {
  const [mode, setMode] = useState<Mode>("assistant");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Web Speech (used in Echo mode — free)
  const recognitionRef = useRef<any | null>(null);
  // MediaRecorder (used in Assistant mode — sends audio to AI for transcription)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    cleanupStream();
    try { recognitionRef.current?.stop(); } catch {}
  }, [cleanupStream]);

  const pickMimeType = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  // ---------- ECHO MODE: Web Speech API (free, no AI) ----------
  const startEchoRecording = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("Voice input not supported on this browser — please type instead");
      return;
    }
    setIsExpanded(true);
    setTranscript("");
    setResponse("");
    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = navigator.language || "en-GB";
      let finalText = "";
      rec.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalText += res[0].transcript + " ";
          else interim += res[0].transcript;
        }
        setTranscript((finalText + interim).trim());
      };
      rec.onerror = (e: any) => {
        console.error("SpeechRecognition error:", e);
        if (e?.error === "not-allowed") toast.error("Microphone blocked — allow access");
        else if (e?.error !== "no-speech" && e?.error !== "aborted") toast.error("Voice input error");
        setIsRecording(false);
      };
      rec.onend = () => {
        setIsRecording(false);
        if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
      };
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
      stopTimerRef.current = setTimeout(() => {
        try { recognitionRef.current?.stop(); } catch {}
        toast.info("Auto-stopped after 60s");
      }, MAX_RECORD_MS);
    } catch (e: any) {
      console.error(e);
      toast.error("Could not start voice input");
      setIsRecording(false);
    }
  };

  const stopEchoRecording = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsRecording(false);
  };

  // ---------- ASSISTANT MODE: MediaRecorder + AI transcription ----------
  const startAssistantRecording = async () => {
    if (isRecording) return;
    setIsExpanded(true);
    setTranscript("");
    setResponse("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        cleanupStream();
        setIsRecording(false);
        if (blob.size < 800) { toast.error("Didn't catch that — try again"); return; }
        await transcribeAndProcess(blob);
      };
      mr.start();
      setIsRecording(true);
      stopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          toast.info("Auto-stopped after 60s");
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORD_MS);
    } catch (err: any) {
      console.error("Mic error:", err);
      toast.error(err?.message?.includes("Permission") ? "Microphone blocked — allow access" : "Could not start recording");
      cleanupStream();
      setIsRecording(false);
    }
  };

  const stopAssistantRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const handleStart = () => (mode === "echo" ? startEchoRecording() : startAssistantRecording());
  const handleStop = () => (mode === "echo" ? stopEchoRecording() : stopAssistantRecording());

  const transcribeAndProcess = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, `voice.${(blob.type.split("/")[1] || "webm").split(";")[0]}`);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in"); return; }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/echo-transcribe-audio`;
      const resp = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: fd });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        if (resp.status === 429) toast.error("Rate limited, please wait");
        else if (resp.status === 402) toast.error("AI credits exhausted");
        else toast.error(errBody?.error || "Transcription failed");
        return;
      }
      const { transcript: text } = await resp.json();
      if (!text || !text.trim()) { toast.info("No speech detected"); return; }
      setTranscript(text);
      await dispatch(text);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Transcription error");
    } finally {
      setIsTranscribing(false);
    }
  };

  const dispatch = async (text: string) => {
    setIsProcessing(true);
    try {
      if (mode === "echo") {
        // No AI — save raw entry. User can classify later via the Classify button.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const today = new Date().toISOString().split("T")[0];
        const time = new Date().toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const { error: insErr } = await supabase.from("echo_entries").insert({
          user_id: user.id,
          type: "unclassified",
          title: text.slice(0, 80),
          description: text.length > 80 ? text : null,
          raw_voice_text: text,
          entry_date: today,
          entry_time: time,
          metadata: { classified: false },
        });
        if (insErr) throw insErr;
        const msg = "Saved — tap 'Classify' on the entry to categorise it";
        setResponse(msg);
        toast.success("Saved to Echo");
        window.dispatchEvent(new CustomEvent("echo:entries-updated"));
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not signed in");
        const { data, error } = await supabase.functions.invoke("voice-assistant", {
          body: { transcript: text },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        const aiResponse = data?.response || "Done.";
        setResponse(aiResponse);
        if (data?.action) {
          const a = data.action;
          const m =
            a.type === "task" ? `Task "${a.data.title}" created`
            : a.type === "calendar_event" ? `Event "${a.data.title}" created`
            : a.type === "email" ? `Draft email to ${a.data.to_email} created`
            : a.type === "goal" ? `Goal "${a.data.title}" created`
            : a.type === "general" ? a.message : "";
          if (m) toast.success(m);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to process");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!transcript.trim() || isProcessing) return;
    await dispatch(transcript.trim());
  };

  const handleClose = () => {
    if (isRecording) handleStop();
    setIsExpanded(false);
    setTranscript("");
    setResponse("");
  };

  const busy = isRecording || isTranscribing || isProcessing;

  return (
    <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 md:right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {isExpanded && (
        <div className="pointer-events-auto w-[calc(100vw-2rem)] sm:w-96 bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary to-accent">
            <div className="flex items-center gap-2 text-white">
              <Mic className="h-4 w-4" />
              <span className="font-medium text-sm">Cnergise Voice</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMode("assistant")}
                className={cn(
                  "text-[11px] px-2 py-1 rounded-md transition",
                  mode === "assistant" ? "bg-white/25 text-white" : "text-white/70 hover:bg-white/10"
                )}
              >
                <Sparkles className="h-3 w-3 inline mr-1" />Assistant
              </button>
              <button
                type="button"
                onClick={() => setMode("echo")}
                className={cn(
                  "text-[11px] px-2 py-1 rounded-md transition",
                  mode === "echo" ? "bg-white/25 text-white" : "text-white/70 hover:bg-white/10"
                )}
              >
                <Wand2 className="h-3 w-3 inline mr-1" />Echo
              </button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground">
              {mode === "echo"
                ? "Say what happened — saved as a note. Classify later to avoid AI cost."
                : "Say what to do — creates tasks, events, goals, drafts."}
            </p>

            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={isRecording ? "Listening…" : "Tap mic or type, then send"}
              className="min-h-[72px] resize-none text-sm"
              disabled={busy && !transcript}
            />

            {(isTranscribing || isProcessing) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isTranscribing ? "Transcribing…" : "Working on it…"}
              </div>
            )}

            {response && (
              <div className="text-xs text-foreground bg-muted/40 rounded-md p-2">
                {response}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSubmit}
                disabled={!transcript.trim() || isProcessing || isRecording}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Send
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative pointer-events-auto">
        <Button
          onClick={isRecording ? handleStop : handleStart}
          size="lg"
          disabled={isTranscribing || isProcessing}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isRecording
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-gradient-to-r from-primary to-accent hover:opacity-90"
          )}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isTranscribing || isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isRecording ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-destructive pointer-events-none" />
            <span className="absolute inset-[-8px] rounded-full animate-pulse opacity-10 bg-destructive pointer-events-none" />
          </>
        )}
      </div>
    </div>
  );
}
