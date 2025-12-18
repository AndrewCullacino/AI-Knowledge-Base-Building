import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Search,
  FileText,
  Brain,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
  Lightbulb,
  Database,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface ProcessedEvent {
  title: string;
  data: any;
  type?: "query" | "search" | "reflection" | "finalize" | "thinking";
  model?: string;
  sources?: number;
}

interface ActivityTimelineProps {
  processedEvents: ProcessedEvent[];
  isLoading: boolean;
}

// Get icon based on event type
const getEventIcon = (event: ProcessedEvent) => {
  const baseClass = "h-3.5 w-3.5";
  
  const title = event.title.toLowerCase();
  
  if (title.includes("generating") || title.includes("query")) {
    return <FileText className={baseClass} />;
  } else if (title.includes("knowledge base") || title.includes("retrieved")) {
    return <Database className={baseClass} />;
  } else if (title.includes("search")) {
    return <Search className={baseClass} />;
  } else if (title.includes("reflection") || title.includes("evaluat") || title.includes("analysis")) {
    return <Lightbulb className={baseClass} />;
  } else if (title.includes("final") || title.includes("report") || title.includes("answer")) {
    return <Sparkles className={baseClass} />;
  } else if (title.includes("thinking")) {
    return <Brain className={baseClass} />;
  }
  return <Globe className={baseClass} />;
};

// Clean up title - remove emojis and simplify for cleaner look
const cleanTitle = (title: string): string => {
  // Remove emojis
  let cleaned = title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|✅|🔍|📚|💭|📝|🔎|✨|🔄/gu, '').trim();
  
  // Simplify titles to match screenshot style
  const lower = cleaned.toLowerCase();
  if (lower.includes("search queries generated") || lower.includes("generating search")) {
    return "Generating Search Queries";
  }
  if (lower.includes("retrieved knowledge") || lower.includes("knowledge base")) {
    return "Knowledge Base Search";
  }
  if (lower.includes("research analysis") || lower.includes("reflection") || lower.includes("evaluating")) {
    return "Reflection";
  }
  if (lower.includes("generating final") || lower.includes("final report") || lower.includes("finalizing")) {
    return "Generating Answer";
  }
  if (lower.includes("searching...")) {
    return "Searching...";
  }
  if (lower.includes("thinking") || lower.includes("initializing")) {
    return "Thinking...";
  }
  return cleaned;
};

// Format data for display - extract key information
const formatEventData = (event: ProcessedEvent): string => {
  const data = event.data;
  if (typeof data === "string") {
    let formatted = data;
    const lower = event.title.toLowerCase();
    
    // For search queries, show them nicely
    if (lower.includes("query") || lower.includes("generating")) {
      if (formatted.includes(" • ")) {
        const terms = formatted.split(" • ").slice(0, 3);
        return terms.map(t => `"${t.trim()}"`).join(", ");
      }
      if (formatted.includes(",")) {
        const terms = formatted.split(",").slice(0, 3);
        return terms.map(t => `"${t.trim()}"`).join(", ");
      }
      return formatted.substring(0, 80);
    }
    
    // For knowledge base search, format sources info
    if (lower.includes("knowledge base") || lower.includes("retrieved")) {
      const sourceMatch = formatted.match(/(\d+)\s*(new\s*)?contexts?/i);
      const totalMatch = formatted.match(/\((\d+)\s*total/i);
      if (sourceMatch) {
        const sources = totalMatch ? totalMatch[1] : sourceMatch[1];
        const relatedMatch = formatted.match(/Related to:\s*([^.]+)/i);
        if (relatedMatch) {
          return `Gathered ${sources} sources. Related to: ${relatedMatch[1].trim()}`;
        }
        return `Gathered ${sources} sources from knowledge base.`;
      }
      // Extract number of documents
      const docsMatch = formatted.match(/(\d+)\s*(document|result|source)/i);
      if (docsMatch) {
        return `Retrieved ${docsMatch[1]} relevant documents.`;
      }
    }
    
    // For reflection, show reasoning summary
    if (lower.includes("reflection") || lower.includes("analysis") || lower.includes("evaluat")) {
      const needMoreMatch = formatted.match(/Need more research:\s*(.+)/i);
      const readyMatch = formatted.toLowerCase().includes("ready") || 
                        formatted.toLowerCase().includes("sufficient") ||
                        formatted.toLowerCase().includes("complete");
      
      if (needMoreMatch) {
        return `Need more info: ${needMoreMatch[1].substring(0, 60)}`;
      }
      if (readyMatch) {
        return "Research complete. Ready to generate comprehensive answer.";
      }
      // Extract key insight
      const sentences = formatted.split(/[.!?]/);
      if (sentences.length > 0) {
        return sentences[0].substring(0, 80) + (sentences[0].length > 80 ? "..." : "");
      }
    }
    
    // For finalization
    if (lower.includes("final") || lower.includes("answer")) {
      return "Synthesizing findings into comprehensive response...";
    }
    
    return formatted.substring(0, 80) + (formatted.length > 80 ? "..." : "");
  }
  
  if (Array.isArray(data)) {
    const items = data.slice(0, 3);
    return items.map(item => `"${String(item).substring(0, 25)}"`).join(", ");
  }
  
  return "";
};

// Extract model info from event if available
const getModelBadge = (event: ProcessedEvent): string | null => {
  // Check if model info is in the data
  if (event.model) return event.model;
  
  const lower = event.title.toLowerCase();
  // Assign default models based on task type
  if (lower.includes("query") || lower.includes("generating search")) {
    return "GPT-4o-mini";
  }
  if (lower.includes("reflection") || lower.includes("analysis")) {
    return "GPT-4o";
  }
  if (lower.includes("final") || lower.includes("answer")) {
    return "GPT-4o";
  }
  return null;
};

export function ActivityTimeline({
  processedEvents,
  isLoading,
}: ActivityTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Auto-collapse when done
    if (!isLoading && processedEvents.length !== 0) {
      setIsCollapsed(true);
    } else if (isLoading) {
      setIsCollapsed(false);
    }
  }, [isLoading, processedEvents.length]);

  return (
    <Card className="border border-border/50 rounded-xl bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Header */}
      <CardHeader className="py-2.5 px-4 border-b border-border/30">
        <button
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
        >
          <Brain className="h-4 w-4 text-primary" />
          <span>Research</span>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />
          )}
          <span className="ml-auto">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </button>
      </CardHeader>

      {/* Timeline Content */}
      {!isCollapsed && (
        <ScrollArea className="max-h-72">
          <CardContent className="py-3 px-4">
            <div className="relative space-y-0">
              {/* Events */}
              {processedEvents.map((event, index) => {
                const isLast = index === processedEvents.length - 1;
                const showLine = !isLast || isLoading;
                const model = getModelBadge(event);
                
                return (
                  <div key={index} className="relative flex gap-3 pb-3 last:pb-0">
                    {/* Timeline line */}
                    {showLine && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border/60" />
                    )}
                    
                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0 w-[18px] h-[18px] rounded-full bg-muted border border-border/50 flex items-center justify-center mt-0.5">
                      {getEventIcon(event)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">
                          {cleanTitle(event.title)}
                        </p>
                        {model && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/50">
                            {model}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {formatEventData(event)}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="relative flex gap-3">
                  <div className="relative z-10 flex-shrink-0 w-[18px] h-[18px] rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mt-0.5">
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {processedEvents.length === 0 ? "Initializing..." : "Searching..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {processedEvents.length === 0 
                        ? "Starting deep research process..." 
                        : "Gathering more information..."}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Empty state */}
              {!isLoading && processedEvents.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Research timeline will appear here</p>
                  <p className="text-xs mt-1 opacity-70">Track query generation, searches, and reflections</p>
                </div>
              )}
            </div>
          </CardContent>
        </ScrollArea>
      )}
    </Card>
  );
}
