import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SquarePen, Send, StopCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
           <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg h-8 w-8"
           >
             <span className="text-lg">+</span>
           </Button>
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
