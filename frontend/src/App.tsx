import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { Sidebar } from "@/components/Sidebar";
import { ProjectsView } from "@/components/ProjectsView";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";
import {
  SCROLL_THRESHOLD_PX,
  SCROLL_DEBOUNCE_MS,
  MAX_REASONING_PREVIEW_LENGTH,
  MAX_REFLECTION_PREVIEW_LENGTH,
} from "@/constants/ui";
import type { Conversation } from "@/types/conversation";

export default function App() {
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<
    ProcessedEvent[]
  >([]);
  const [historicalActivities, setHistoricalActivities] = useState<
    Record<string, ProcessedEvent[]>
  >({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasFinalizeEventOccurredRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Repository and mode state
  const [repository, setRepository] = useState<string>("cnb/docs");
  const [knowledgeBaseType, setKnowledgeBaseType] = useState<string>("wikipedia"); // NEW: KB type selector
  const [ragEnabled, setRagEnabled] = useState<boolean>(true);
  const [deepResearchMode, setDeepResearchMode] = useState<boolean>(false);
  const [showProjectsView, setShowProjectsView] = useState<boolean>(false);

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);

  // Helper function to process update events and create timeline entries
  const processUpdateEvent = useCallback((update: any) => {
    // DEBUG: Log all updates with expanded details
    logger.debug("🔍 [DEBUG] Update event:", JSON.stringify(update, null, 2));
    logger.debug("🔍 [DEBUG] Update keys:", Object.keys(update));
    if (update.deep_research) {
      logger.debug("🔍 [DEBUG] deep_research keys:", Object.keys(update.deep_research));
    }

    let processedEvent: ProcessedEvent | null = null;

    // Check for deep_research subgraph updates (they come nested under the node name)
    const deepResearchUpdate = update.deep_research || update;
    logger.debug("🔍 [DEBUG] deepResearchUpdate keys:", Object.keys(deepResearchUpdate));

    // Check for generate_queries
    if (deepResearchUpdate.generate_queries) {
      const queries = deepResearchUpdate.generate_queries.queries || [];
      const queryCount = queries.length;
      processedEvent = {
        title: "Generating Search Queries",
        data: queryCount > 0 ? `Generated ${queryCount} search ${queryCount === 1 ? 'query' : 'queries'}` : "Planning search strategy...",
      };
    }
    // Check for retrieve_contexts
    else if (deepResearchUpdate.retrieve_contexts) {
      const sourcesCount = deepResearchUpdate.retrieve_contexts.sources_count || 0;
      const keywords = deepResearchUpdate.retrieve_contexts.keywords || [];
      const keywordText = keywords.length > 0 ? keywords.join(", ") : "";
      processedEvent = {
        title: "Knowledge Base Search",
        data: keywordText
          ? `Gathered ${sourcesCount} sources. Related to: ${keywordText}.`
          : `Gathered ${sourcesCount} sources.`,
      };
    }
    // Check for reflect
    else if (deepResearchUpdate.reflect) {
      const sufficient = deepResearchUpdate.reflect.sufficient || false;
      const confidence = deepResearchUpdate.reflect.confidence || 0;
      const reasoning = deepResearchUpdate.reflect.reasoning || "";
      const loopCount = deepResearchUpdate.reflect.loop_count || 0;
      processedEvent = {
        title: "Reflection",
        data: sufficient
          ? `Research complete. Confidence: ${(confidence * 100).toFixed(0)}%`
          : `Need more information, ${reasoning.substring(0, MAX_REASONING_PREVIEW_LENGTH)}`,
      };
      
      if (!sufficient) {
        // After reflection, if not sufficient, we'll continue searching
        setTimeout(() => {
          setProcessedEventsTimeline((prev) => [
            ...prev,
            { title: "Searching...", data: "Gathering more information..." }
          ]);
        }, 100);
      }
    }
    // Check for finalize_report
    else if (deepResearchUpdate.finalize_report) {
      const numContexts = deepResearchUpdate.finalize_report.num_contexts || 0;
      const numSources = deepResearchUpdate.finalize_report.num_sources || 0;
      processedEvent = {
        title: "Generating Answer",
        data: `Synthesizing ${numContexts} contexts from ${numSources} sources...`,
      };
      hasFinalizeEventOccurredRef.current = true;
    }
    // Skip verbose step_status messages - rely on custom events instead

    if (processedEvent) {
      setProcessedEventsTimeline((prevEvents) => {
        // Avoid exact duplicate events
        const lastEvent = prevEvents[prevEvents.length - 1];
        if (lastEvent && lastEvent.title === processedEvent!.title && lastEvent.data === processedEvent!.data) {
          return prevEvents;
        }
        return [...prevEvents, processedEvent!];
      });
    }
  }, []);

  const thread = useStream<{
    messages: Message[];
    repository: string;
    knowledge_base_type: string;  // NEW: KB type field
    rag_enabled: boolean;
    deep_research_mode: boolean;
    max_research_loops: number;
    initial_search_query_count: number;
    reasoning_model: string;
    // DeepResearch state fields
    step_status?: string;
    generate_queries?: any;
    retrieve_contexts?: any;
    reflect?: any;
    finalize_report?: any;
    research_queries?: string[];
    all_contexts?: any[];
    research_loop_count?: number;
  }>({
    apiUrl: window.location.origin,
    assistantId: "agent",
    messagesKey: "messages",
    onUpdateEvent: (update: any) => {
      // Process updates from the stream
      logger.debug("🔄 [onUpdateEvent] CALLED");
      logger.debug("🔄 [onUpdateEvent] update:", update);
      logger.debug("🔄 [onUpdateEvent] update type:", typeof update);
      logger.debug("🔄 [onUpdateEvent] update keys:", update ? Object.keys(update) : 'null');
      processUpdateEvent(update);
    },
    onCustomEvent: (event: any, { mutate }) => {
      // Custom events from deep_research workflow
      logger.debug("✨ [onCustomEvent]", event);
      
      if (!deepResearchMode) return;
      
      let processedEvent: ProcessedEvent | null = null;
      
      // Handle deep_research_step events
      if (event && typeof event === "object") {
        const step = event.step;
        
        switch (step) {
          case "generate_queries_start":
            // Don't show the "start" event, wait for complete event with queries
            // This prevents showing "Planning search strategy..." before queries are ready
            break;
          case "generate_queries_complete":
            const queries = event.queries || [];
            // Show first query as concise summary instead of count
            const querySummary = queries.length > 0 ? queries[0] : "Search queries generated";
            processedEvent = {
              title: "Generating Search Queries",
              data: querySummary,
            };
            break;
          case "retrieve_start":
            processedEvent = {
              title: "Knowledge Base Search",
              data: event.message || "Searching...",
            };
            break;
          case "retrieve_complete":
            // Format: "Gathered N sources. Related to: keyword1, keyword2, keyword3."
            const sourceCount = event.sources_count || event.total_contexts || 0;
            const keywords = event.keywords || event.related_keywords || [];
            const keywordText = keywords.length > 0 ? keywords.slice(0, 3).join(", ") : "";
            processedEvent = {
              title: "Knowledge Base Search",
              data: keywordText
                ? `Gathered ${sourceCount} sources. Related to: ${keywordText}.`
                : `Gathered ${sourceCount} sources.`,
            };
            break;
          case "reflect_start":
            processedEvent = {
              title: "Reflection",
              data: event.message || "Evaluating research quality...",
            };
            break;
          case "reflect_complete":
            const sufficient = event.sufficient;
            const fullReasoning = event.reasoning || "";
            processedEvent = {
              title: "Reflection",
              data: sufficient
                ? `Research complete. Confidence: ${((event.confidence || 0) * 100).toFixed(0)}%`
                : `Need more information, ${fullReasoning}`,
            };

            if (!sufficient) {
              // Continue searching - add a "Searching web..." event
              setTimeout(() => {
                setProcessedEventsTimeline((prev) => [
                  ...prev,
                  { title: "Searching web", data: "Gathering additional sources..." }
                ]);
              }, 100);
            }
            break;
          case "finalize_start":
            processedEvent = {
              title: "Generating Answer",
              data: event.message || "Synthesizing research...",
            };
            hasFinalizeEventOccurredRef.current = true;
            break;
          case "finalize_complete":
            processedEvent = {
              title: "Generating Answer",
              data: `Report ready (${event.sources_count || 0} sources)`,
            };
            break;
        }
        
        if (processedEvent) {
          setProcessedEventsTimeline((prevEvents) => {
            // Avoid exact duplicate events
            const lastEvent = prevEvents[prevEvents.length - 1];
            if (lastEvent && lastEvent.title === processedEvent!.title && lastEvent.data === processedEvent!.data) {
              return prevEvents;
            }
            return [...prevEvents, processedEvent!];
          });
        }
      }
    },
    onDebugEvent: (event: any) => {
      // Debug events provide visibility into subgraph execution
      logger.debug("🐛 [onDebugEvent]", event);
      if (event?.type === "task_result" && event?.payload) {
        // Task result contains subgraph state updates
        const payload = event.payload;
        if (payload.result && Array.isArray(payload.result)) {
          payload.result.forEach((result: any) => {
            if (result && typeof result === "object") {
              processUpdateEvent(result);
            }
          });
        }
      }
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Load conversations on mount and restore last conversation
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch("/api/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);

          // Try to restore last conversation from localStorage
          const savedId = localStorage.getItem("currentConversationId");
          if (savedId && data.conversations.find((c: Conversation) => c.id === savedId)) {
            setCurrentConversationId(savedId);
          }
        }
      } catch (error) {
        logger.error("Failed to load conversations:", error);
      } finally {
        setConversationsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Load conversation messages
  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setCurrentConversationId(convId);
        localStorage.setItem("currentConversationId", convId);
        // Clear current messages to show the selected conversation
        setMessages([]);
        setProcessedEventsTimeline([]);
        setHistoricalActivities({});
      }
    } catch (error) {
      logger.error("Failed to load conversation:", error);
    }
  };

  // Create new conversation
  const createConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kb_type: knowledgeBaseType,
          mode: deepResearchMode ? "deep_research" : ragEnabled ? "rag" : "gpt",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConv = data.conversation;
        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        localStorage.setItem("currentConversationId", newConv.id);

        // Clear current messages
        window.location.reload();

        return newConv.id;
      }
    } catch (error) {
      logger.error("Failed to create conversation:", error);
    }
    return null;
  };

  // Save messages to current conversation
  const saveMessagesToConversation = async (convId: string, messages: Message[]) => {
    try {
      // Save each new message that isn't already saved
      for (const message of messages) {
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: message.type,
            content: message.content,
            metadata: (message as any).additional_kwargs || {},
          }),
        });
      }

      // Reload conversations to update metadata (title, count, etc.)
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      logger.error("Failed to save messages:", error);
    }
  };

  // Delete conversation
  const deleteConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));

        if (currentConversationId === convId) {
          localStorage.removeItem("currentConversationId");
          // Load first remaining conversation or create new
          const remaining = conversations.filter((c) => c.id !== convId);
          if (remaining.length > 0) {
            await loadConversation(remaining[0].id);
          } else {
            setCurrentConversationId(null);
            window.location.reload();
          }
        }
      }
    } catch (error) {
      logger.error("Failed to delete conversation:", error);
    }
  };

  // Smart scroll behavior: only auto-scroll when user is near bottom
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect user scroll events
  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (!scrollViewport) return;

    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Check if user is near bottom
      const isNearBottom =
        scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < SCROLL_THRESHOLD_PX;

      if (isNearBottom) {
        setIsUserScrolling(false);
        setShowScrollToBottom(false);
      } else {
        // User has scrolled up
        setIsUserScrolling(true);
        setShowScrollToBottom(thread.isLoading); // Only show button during generation
      }

      // Reset scrolling flag after user stops scrolling (debounce)
      scrollTimeoutRef.current = setTimeout(() => {
        const currentIsNearBottom =
          scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < SCROLL_THRESHOLD_PX;
        if (currentIsNearBottom) {
          setIsUserScrolling(false);
        }
      }, SCROLL_DEBOUNCE_MS);
    };

    scrollViewport.addEventListener("scroll", handleScroll);
    return () => {
      scrollViewport.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [thread.isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        // Only auto-scroll if user hasn't manually scrolled up
        const isNearBottom =
          scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < SCROLL_THRESHOLD_PX;

        if (isNearBottom || !isUserScrolling) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
          setShowScrollToBottom(false);
        } else {
          // User is scrolled up, show the jump-to-bottom button only during generation
          setShowScrollToBottom(thread.isLoading);
        }
      }
    }
  }, [thread.messages, isUserScrolling, thread.isLoading]);

  // Function to scroll to bottom manually
  const scrollToBottom = useCallback(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollViewport) {
      scrollViewport.scrollTo({
        top: scrollViewport.scrollHeight,
        behavior: "smooth",
      });
      setIsUserScrolling(false);
      setShowScrollToBottom(false);
    }
  }, []);

  // Debug: Watch thread.values for deep research state
  useEffect(() => {
    if (!deepResearchMode || !thread.isLoading) return;

    const values = thread.values;
    if (!values) return;

    // Log all values for debugging
    logger.debug("🔍 [DEBUG] Thread values:", values);

    // Process values directly from thread.values
    processUpdateEvent(values);
  }, [thread.values, deepResearchMode, thread.isLoading, processUpdateEvent]);

  // Debug: Watch thread.history for all states
  useEffect(() => {
    if (!deepResearchMode) return;
    logger.debug("📚 [DEBUG] Thread history:", thread.history);
  }, [thread.history, deepResearchMode]);

  useEffect(() => {
    if (
      hasFinalizeEventOccurredRef.current &&
      !thread.isLoading &&
      thread.messages.length > 0
    ) {
      const lastMessage = thread.messages[thread.messages.length - 1];
      if (lastMessage && lastMessage.type === "ai" && lastMessage.id) {
        setHistoricalActivities((prev) => ({
          ...prev,
          [lastMessage.id!]: [...processedEventsTimeline],
        }));

        // Auto-save AI message to conversation
        if (currentConversationId) {
          saveMessagesToConversation(currentConversationId, [lastMessage]);
        }
      }
      hasFinalizeEventOccurredRef.current = false;
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline, currentConversationId, saveMessagesToConversation]);

  const handleSubmit = useCallback(
    async (submittedInputValue: string) => {
      if (!submittedInputValue.trim()) return;
      setProcessedEventsTimeline([]);
      hasFinalizeEventOccurredRef.current = false;

      // Create conversation if none exists
      let convId = currentConversationId;
      if (!convId) {
        convId = await createConversation();
        if (!convId) return; // Failed to create
      }

      const humanMessage: Message = {
        type: "human",
        content: submittedInputValue,
        id: Date.now().toString(),
      };

      const newMessages: Message[] = [
        ...(thread.messages || []),
        humanMessage,
      ];

      // Save human message to conversation
      await saveMessagesToConversation(convId, [humanMessage]);

      thread.submit(
        {
          messages: newMessages,
          repository: repository,
          knowledge_base_type: knowledgeBaseType,
          rag_enabled: ragEnabled,
          deep_research_mode: deepResearchMode,
          max_research_loops: 3,
          initial_search_query_count: 3,
          reasoning_model: "gpt-4o-mini",
        },
        {
          streamMode: ["custom", "debug", "updates", "values", "messages-tuple"],
        }
      );
    },
    [thread, repository, ragEnabled, deepResearchMode, knowledgeBaseType, currentConversationId, createConversation, saveMessagesToConversation]
  );

  const handleCancel = useCallback(() => {
    thread.stop();
    window.location.reload();
  }, [thread]);

  const handleNewChat = useCallback(async () => {
    await createConversation();
  }, [createConversation]);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentKB={repository}
        onSelectKB={setRepository}
        onNewChat={handleNewChat}
        ragEnabled={ragEnabled}
        onRagToggle={setRagEnabled}
        deepResearchMode={deepResearchMode}
        onDeepResearchToggle={setDeepResearchMode}
        showProjectsView={showProjectsView}
        onToggleProjectsView={setShowProjectsView}
        knowledgeBaseType={knowledgeBaseType}
        onKnowledgeBaseTypeChange={setKnowledgeBaseType}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        conversationsLoading={conversationsLoading}
      />

      {/* Main Content */}
      <main className="flex-1 h-full flex flex-col relative bg-background overflow-hidden">
        {showProjectsView ? (
          <ProjectsView
            currentKB={repository}
            onSelectKB={setRepository}
            onBackToChat={() => setShowProjectsView(false)}
          />
        ) : (
          <div className="flex-1 overflow-hidden relative flex flex-col max-w-4xl mx-auto w-full">
            {thread.messages.length === 0 ? (
              <WelcomeScreen
                handleSubmit={handleSubmit}
                isLoading={thread.isLoading}
                onCancel={handleCancel}
              />
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="glass flex flex-col items-center justify-center gap-6 max-w-md text-center p-8 rounded-2xl border border-destructive/20 animate-scaleIn">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h2 className="text-2xl text-destructive font-semibold">
                    Connection Error
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {JSON.stringify(error)}
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200"
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            ) : (
              <ChatMessagesView
                messages={thread.messages}
                isLoading={thread.isLoading}
                scrollAreaRef={scrollAreaRef}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                liveActivityEvents={processedEventsTimeline}
                historicalActivities={historicalActivities}
                deepResearchMode={deepResearchMode}
                showScrollToBottom={showScrollToBottom}
                onScrollToBottom={scrollToBottom}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
