
import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, Play, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
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
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
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
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsListening(true);
    setTranscript("");
    setResponse("");
    
    toast({
      title: "Voice Assistant Activated",
      description: "Listening for your command...",
    });
    
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
    toast({
      title: "Voice Assistant Stopped",
      description: "Stopped listening",
    });
  };

  const handleProcessCommand = async (text: string) => {
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the voice assistant.",
          variant: "destructive",
        });
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
        toast({
          title: "Error",
          description: error.message || "Failed to process command",
          variant: "destructive",
        });
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
        }
        
        toast({
          title: "Action Completed",
          description: actionMessage,
        });
      }

      handlePlayResponse(aiResponse);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
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
      
      toast({
        title: "Playing Response",
        description: "Assistant is speaking...",
      });
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

  const handleClearConversation = () => {
    setTranscript("");
    setResponse("");
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <Button
          onClick={isListening ? handleStopListening : handleStartListening}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-500",
            isListening
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple hover:opacity-90"
          )}
        >
          {isListening ? (
            <Square className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Animated rings when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-destructive"></span>
            <span className="absolute inset-[-8px] rounded-full animate-pulse opacity-10 bg-destructive"></span>
          </>
        )}

        {/* Transcript and response card */}
        {(transcript || response) && (
          <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-card rounded-lg shadow-lg border p-4 mb-2 transition-all duration-300">
            {transcript && (
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-taskfinity-blue to-taskfinity-purple flex items-center justify-center mr-2">
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm font-medium">You</p>
                </div>
                <p className="text-sm pl-8">{transcript}</p>
              </div>
            )}

            {response && (
              <div>
                <div className="flex items-start mb-1">
                  <div className="w-6 h-6 rounded-full bg-taskfinity-teal flex items-center justify-center mr-2">
                    <Volume2 className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Assistant</p>
                    {isPlaying && <Progress className="h-1 mt-1" value={65} />}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm pl-8">{response}</p>
              </div>
            )}

            <div className="flex justify-end mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
