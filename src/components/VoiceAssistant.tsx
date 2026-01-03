
import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, Play, PauseCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        await handleProcessCommand(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("Failed to recognize speech. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    setIsListening(true);
    setIsExpanded(true);
    setTranscript("");
    setResponse("");
    
    toast.info("Listening for your command...");
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleProcessCommand = async (text: string) => {
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to use the voice assistant.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: { transcript: text },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error processing command:', error);
        toast.error(error.message || "Failed to process command");
        return;
      }

      const aiResponse = data.response || "I've processed your request.";
      setResponse(aiResponse);
      
      if (data.action) {
        const actionType = data.action.type;
        let actionMessage = "";
        
        if (actionType === "task") {
          actionMessage = `Task "${data.action.data.title}" created successfully!`;
        } else if (actionType === "calendar_event") {
          actionMessage = `Calendar event "${data.action.data.title}" created successfully!`;
        } else if (actionType === "email") {
          actionMessage = `Email draft to ${data.action.data.to_email} created successfully!`;
        } else if (actionType === "goal") {
          actionMessage = `Goal "${data.action.data.title}" created successfully!`;
        } else if (actionType === "general") {
          actionMessage = data.action.message;
        }
        
        if (actionMessage) {
          toast.success(actionMessage);
        }
      }

      handlePlayResponse(aiResponse);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      synthRef.current = new SpeechSynthesisUtterance(text);
      synthRef.current.onstart = () => setIsPlaying(true);
      synthRef.current.onend = () => setIsPlaying(false);
      synthRef.current.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(synthRef.current);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    setTranscript("");
    setResponse("");
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded card */}
      {isExpanded && (
        <div className="w-80 sm:w-96 bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-accent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-white">Cnergise Voice</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {isProcessing && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing your request...</span>
              </div>
            )}
            
            {isListening && !transcript && (
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">Listening...</span>
              </div>
            )}

            {transcript && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">You</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Your command</span>
                </div>
                <p className="text-sm pl-8 text-foreground">{transcript}</p>
              </div>
            )}

            {response && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Volume2 className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Assistant</span>
                  {response && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 ml-auto"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <PauseCircle className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm pl-8 text-foreground">{response}</p>
                {isPlaying && <Progress className="h-1 mt-2 ml-8" value={65} />}
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="px-4 py-3 bg-muted/50 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Try: "Create a task to review budget tomorrow" or "Set a goal to exercise more"
            </p>
          </div>
        </div>
      )}

      {/* Main button */}
      <div className="relative">
        <Button
          onClick={isListening ? handleStopListening : handleStartListening}
          size="lg"
          disabled={isProcessing}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isListening
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-gradient-to-r from-primary to-accent hover:opacity-90"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Animated rings when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-destructive pointer-events-none" />
            <span className="absolute inset-[-8px] rounded-full animate-pulse opacity-10 bg-destructive pointer-events-none" />
          </>
        )}
      </div>
    </div>
  );
}
