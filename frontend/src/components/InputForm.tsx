import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SquarePen, Send, StopCircle, Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceInput } from "@/hooks/useVoiceInput";

// Updated InputFormProps
interface InputFormProps {
  onSubmit: (inputValue: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  hasHistory: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  hasHistory,
}) => {
  const [internalInputValue, setInternalInputValue] = useState("");
  const {
    isRecording,
    transcript,
    error: voiceError,
    isSupported,
    isProcessing,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceInput();

  // Update input value when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInternalInputValue((prev) => (prev ? prev + " " : "") + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Show voice error as toast or inline message
  useEffect(() => {
    if (voiceError) {
      console.error("Voice input error:", voiceError);
      // You could also show a toast notification here
    }
  }, [voiceError]);

  const handleInternalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInputValue.trim()) return;
    onSubmit(internalInputValue);
    setInternalInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit with Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const handleVoiceButtonClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const isSubmitDisabled = !internalInputValue.trim() || isLoading;

  return (
    <form
      onSubmit={handleInternalSubmit}
      className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-2xl border border-border/50"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground font-medium ml-1">
          How can I help you today?
        </label>
        <div className="flex flex-row items-start gap-3">
          <Textarea
            value={internalInputValue}
            onChange={(e) => setInternalInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="w-full text-foreground placeholder-muted-foreground/50 resize-none border-0 focus:outline-none focus:ring-0 outline-none focus-visible:ring-0 shadow-none bg-transparent text-base min-h-[48px] max-h-[200px] leading-relaxed p-0"
            rows={1}
            aria-label="Message input"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {isSupported && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`rounded-lg h-8 w-8 transition-colors ${
                  isRecording
                    ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    : isProcessing
                    ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={handleVoiceButtonClick}
                disabled={isProcessing}
                title={
                  isRecording
                    ? "Stop recording"
                    : isProcessing
                    ? "Processing audio..."
                    : "Start voice input"
                }
              >
                <Mic
                  className={`h-5 w-5 ${
                    isRecording || isProcessing ? "animate-pulse" : ""
                  }`}
                />
              </Button>
              {isProcessing && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Transcribing...
                </span>
              )}
              {voiceError && (
                <span className="text-xs text-red-500 max-w-[200px] truncate" title={voiceError}>
                  {voiceError}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/20 rounded-lg transition-all duration-200 h-8 w-8"
              onClick={onCancel}
              aria-label="Stop generation"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={`rounded-lg transition-all duration-200 h-8 w-8 ${
                isSubmitDisabled
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              }`}
              disabled={isSubmitDisabled}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
