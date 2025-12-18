import type React from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, CopyCheck, ChevronDown, ChevronUp, ArrowDown } from "lucide-react";
import { InputForm } from "@/components/InputForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  ActivityTimeline,
  ProcessedEvent,
} from "@/components/ActivityTimeline"; // Assuming ActivityTimeline is in the same dir or adjust path
import { CitationRenderer } from "./CitationRenderer";
import { logger } from "@/utils/logger";

// Markdown component props type from former ReportView
type MdComponentProps = {
  className?: string;
  children?: ReactNode;
  [key: string]: any;
};

// Markdown components (from former ReportView.tsx)
const mdComponents = {
  h1: ({ className, children, ...props }: MdComponentProps) => (
    <h1 className={cn("text-2xl font-bold mt-4 mb-2 text-foreground", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }: MdComponentProps) => (
    <h2 className={cn("text-xl font-bold mt-3 mb-2 text-foreground", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: MdComponentProps) => (
    <h3 className={cn("text-lg font-bold mt-3 mb-1 text-foreground", className)} {...props}>
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }: MdComponentProps) => (
    <p className={cn("mb-3 leading-7 text-foreground", className)} {...props}>
      {children}
    </p>
  ),
  a: ({ className, children, href, ...props }: MdComponentProps) => (
    <Badge className="text-xs mx-0.5">
      <a
        className={cn("text-primary hover:text-primary/80 text-xs", className)}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    </Badge>
  ),
  ul: ({ className, children, ...props }: MdComponentProps) => (
    <ul className={cn("list-disc pl-6 mb-3 text-foreground", className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: MdComponentProps) => (
    <ol className={cn("list-decimal pl-6 mb-3 text-foreground", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }: MdComponentProps) => (
    <li className={cn("mb-1 text-foreground", className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ className, children, ...props }: MdComponentProps) => (
    <blockquote
      className={cn(
        "border-l-4 border-muted pl-4 italic my-3 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }: MdComponentProps) => (
    <code
      className={cn(
        "bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ className, children, ...props }: MdComponentProps) => (
    <pre
      className={cn(
        "bg-muted text-foreground p-3 rounded-lg overflow-x-auto font-mono text-xs my-3 border border-border",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  hr: ({ className, ...props }: MdComponentProps) => (
    <hr className={cn("border-neutral-300 dark:border-neutral-600 my-4", className)} {...props} />
  ),
  table: ({ className, children, ...props }: MdComponentProps) => (
    <div className="my-3 overflow-x-auto">
      <table className={cn("border-collapse w-full", className)} {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ className, children, ...props }: MdComponentProps) => (
    <th
      className={cn(
        "border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-left font-bold bg-neutral-50 dark:bg-neutral-800",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }: MdComponentProps) => (
    <td
      className={cn("border border-neutral-300 dark:border-neutral-600 px-3 py-2", className)}
      {...props}
    >
      {children}
    </td>
  ),
};

// Props for HumanMessageBubble
interface HumanMessageBubbleProps {
  message: Message;
  mdComponents: typeof mdComponents;
}

// HumanMessageBubble Component
const HumanMessageBubble: React.FC<HumanMessageBubbleProps> = ({
  message,
  mdComponents,
}) => {
  return (
    <div
      className="gradient-primary text-white rounded-2xl rounded-br-md break-words min-h-7 max-w-[100%] sm:max-w-[80%] px-4 py-3 shadow-lg animate-slideInRight"
      style={{
        boxShadow: '0 2px 12px rgba(102, 126, 234, 0.2), 0 4px 24px rgba(118, 75, 162, 0.15)'
      }}
    >
      <ReactMarkdown components={mdComponents}>
        {typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content)}
      </ReactMarkdown>
    </div>
  );
};

// Props for AiMessageBubble
interface AiMessageBubbleProps {
  message: Message;
  historicalActivity: ProcessedEvent[] | undefined;
  liveActivity: ProcessedEvent[] | undefined;
  isLastMessage: boolean;
  isOverallLoading: boolean;
  handleCopy: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
}

// AiMessageBubble Component
const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  message,
  historicalActivity,
  liveActivity,
  isLastMessage,
  isOverallLoading,
  handleCopy,
  copiedMessageId,
}) => {
  // Determine which activity events to show and if it's for a live loading message
  const activityForThisBubble =
    isLastMessage && isOverallLoading ? liveActivity : historicalActivity;
  const isLiveActivityForThisBubble = isLastMessage && isOverallLoading;
  const [showReasoning, setShowReasoning] = useState(true); // Default to expanded

  // Extract reasoning content from message additional_kwargs
  const reasoningContent = (message as any).additional_kwargs?.reasoning_content || "";

  return (
    <div className="relative break-words flex flex-col max-w-[100%] sm:max-w-[85%] animate-fadeInUp">
      {/* Activity Timeline */}
      {activityForThisBubble && activityForThisBubble.length > 0 && (
        <div className="mb-3 pb-3">
          <ActivityTimeline
            processedEvents={activityForThisBubble}
            isLoading={isLiveActivityForThisBubble}
          />
        </div>
      )}

      {/* Reasoning Process */}
      {reasoningContent && (
        <div className="mb-3">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 transition-all duration-200"
            aria-expanded={showReasoning}
            aria-label="Toggle thinking process"
          >
            <span>🤔</span>
            <span>Thinking Process</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-500">({reasoningContent.length} chars)</span>
            {showReasoning ? (
              <ChevronUp className="w-4 h-4 ml-auto transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200" />
            )}
          </button>
          {showReasoning && (
            <div className="glass rounded-xl p-4 text-sm border border-neutral-200 dark:border-white/10 animate-fadeInUpSmooth">
              <div className="text-neutral-700 dark:text-neutral-300 italic whitespace-pre-wrap leading-relaxed">
                {reasoningContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Message Content */}
      <div className="glass rounded-2xl rounded-bl-md p-4 border border-neutral-200 dark:border-white/10 shadow-lg">
        <MessageDisplay message={message} />
      </div>

      {/* Copy Button */}
      {message.content.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-end text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all duration-200"
          onClick={() =>
            handleCopy(
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content),
              message.id!
            )
          }
        >
          {copiedMessageId === message.id ? (
            <>
              <CopyCheck className="w-4 h-4 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export interface ChatMessagesViewProps {
  messages: Message[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (inputValue: string) => void;
  onCancel: () => void;
  liveActivityEvents: ProcessedEvent[];
  historicalActivities: Record<string, ProcessedEvent[]>;
  deepResearchMode?: boolean;
  showScrollToBottom?: boolean;
  onScrollToBottom?: () => void;
}

function MessageDisplay({ message }: { message: Message }) {
  const contentString = typeof message.content === "string"
    ? message.content
    : JSON.stringify(message.content);

  let content = contentString;
  let sources: any[] = [];  // Initialize to empty array to prevent crashes

  try {
    const parsed = JSON.parse(contentString);
    if (parsed.content && parsed.sources) {
      content = parsed.content;
      sources = parsed.sources;
    }
  } catch {
    // not JSON; leave as plain text
  }

  return (
    <div className="message">
      <CitationRenderer content={content} sources={sources} />
    </div>
  );
}

export function ChatMessagesView({
  messages,
  isLoading,
  scrollAreaRef,
  onSubmit,
  onCancel,
  liveActivityEvents,
  historicalActivities,
  deepResearchMode = false,
  showScrollToBottom = false,
  onScrollToBottom,
}: ChatMessagesViewProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      logger.error("Failed to copy text: ", err);
    }
  };
  return (
    <div className="flex flex-col h-full relative">
      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-2 max-w-4xl mx-auto pt-16">
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            return (
              <div key={message.id || `msg-${index}`} className="space-y-3">
                <div
                  className={`flex items-start gap-3 ${
                    message.type === "human" ? "justify-end" : ""
                  }`}
                >
                  {message.type === "human" ? (
                    <HumanMessageBubble
                      message={message}
                      mdComponents={mdComponents}
                    />
                  ) : (
                    <AiMessageBubble
                      message={message}
                      historicalActivity={historicalActivities[message.id!]}
                      liveActivity={liveActivityEvents} // Pass global live events
                      isLastMessage={isLast}
                      isOverallLoading={isLoading} // Pass global loading state
                      handleCopy={handleCopy}
                      copiedMessageId={copiedMessageId}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {isLoading &&
            (messages.length === 0 ||
              messages[messages.length - 1].type === "human") && (
              <div className="flex items-start gap-3 mt-3 animate-fadeInUp">
                <div className="glass relative group max-w-[85%] md:max-w-[80%] rounded-2xl rounded-bl-md p-4 shadow-lg border border-white/10 w-full min-h-[56px]">
                  {deepResearchMode ? (
                    <div className="text-xs">
                      <ActivityTimeline
                        processedEvents={liveActivityEvents}
                        isLoading={true}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-start h-full gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-neutral-300 ml-2">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && onScrollToBottom && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 animate-fadeInUp">
          <Button
            onClick={onScrollToBottom}
            variant="secondary"
            size="sm"
            className="shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
            aria-label="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4" />
            <span className="text-sm font-medium">New messages</span>
          </Button>
        </div>
      )}

      <InputForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        onCancel={onCancel}
        hasHistory={messages.length > 0}
      />
    </div>
  );
}


