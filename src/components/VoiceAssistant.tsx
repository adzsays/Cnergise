
import React, { useState } from "react";
import { Mic, Square, Volume2, Play, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  // Mock function to start listening
  const handleStartListening = () => {
    setIsListening(true);
    toast({
      title: "Voice Assistant Activated",
      description: "Listening for your command...",
    });
    
    // Simulate receiving a transcript after 3 seconds
    setTimeout(() => {
      setTranscript("Add a meeting with the marketing team for tomorrow at 10 AM");
      setIsListening(false);
      handleProcessCommand();
    }, 3000);
  };

  // Mock function to stop listening
  const handleStopListening = () => {
    setIsListening(false);
    toast({
      title: "Voice Assistant Stopped",
      description: "Stopped listening",
    });
  };

  // Mock function to process the command
  const handleProcessCommand = () => {
    // Simulate AI processing
    setTimeout(() => {
      setResponse(
        "I've added a new meeting called 'Marketing Team Meeting' to your calendar for tomorrow at 10 AM. Would you like me to invite the marketing team members?"
      );
      handlePlayResponse();
    }, 1500);
  };

  // Mock function to play the response
  const handlePlayResponse = () => {
    setIsPlaying(true);
    toast({
      title: "Playing Response",
      description: "Assistant is speaking...",
    });
    
    // Simulate end of playback
    setTimeout(() => {
      setIsPlaying(false);
      toast({
        title: "Action Completed",
        description: "Meeting has been added to your calendar",
      });
    }, 4000);
  };

  // Function to clear the conversation
  const handleClearConversation = () => {
    setTranscript("");
    setResponse("");
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
