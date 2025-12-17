import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { RepositorySelector } from "@/components/RepositorySelector";
import { KnowledgeBaseManager } from "@/components/KnowledgeBaseManager";
import { Button } from "@/components/ui/button";

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
  const [ragEnabled, setRagEnabled] = useState<boolean>(true);
  const [deepResearchMode, setDeepResearchMode] = useState<boolean>(false);
  const [showKBManager, setShowKBManager] = useState<boolean>(false);

  const thread = useStream<{
    messages: Message[];
    repository: string;
    rag_enabled: boolean;
    deep_research_mode: boolean;
    max_research_loops: number;
    initial_search_query_count: number;
    reasoning_model: string;
  }>({
    apiUrl: import.meta.env.DEV
      ? "http://localhost:2024"
      : "http://localhost:8123",
    assistantId: "agent",
    messagesKey: "messages",
    streamMode: "values",  // Changed to "values" to receive full state including subgraph updates
    onUpdateEvent: (event: any) => {
      // DEBUG: Log all events to console for diagnosis
      console.log("🔍 [DEBUG] Received event:", JSON.stringify(event, null, 2));

      let processedEvent: ProcessedEvent | null = null;

      // DeepResearch events - Show progress for each step
      // Check for step status first to show progress
      if (event.step_status === "query_generation" && !event.generate_queries) {
        // Query generation started but not completed yet
        const loopCount = event.research_loop_count || 0;
        const previousQueries = event.research_queries || [];
        processedEvent = {
          title: `🧠 Generating Search Queries (Round ${loopCount + 1})`,
          data: previousQueries.length > 0
            ? `Previous: ${previousQueries.slice(-3).join(" • ")} | Generating new queries...`
            : "Analyzing question and planning search strategy...",
        };
      } else if (event.generate_queries) {
        // Query generation completed
        const queries = event.generate_queries?.queries || [];
        const loopCount = event.research_loop_count || 0;
        processedEvent = {
          title: `✅ Search Queries Generated (Round ${loopCount + 1})`,
          data: queries.join(" • ") || "Queries ready",
        };
      } else if (event.step_status === "retrieval" && !event.retrieve_contexts) {
        // Retrieval started but not completed
        const queries = event.research_queries || [];
        const recentQueries = queries.slice(-3);
        processedEvent = {
          title: "🔎 Searching Knowledge Base...",
          data: `Querying: ${recentQueries.join(" • ")}`,
        };
      } else if (event.retrieve_contexts) {
        const numContexts = event.retrieve_contexts?.num_contexts || 0;
        const newContexts = event.retrieve_contexts?.new_contexts || 0;
        const loopNum = event.retrieve_contexts?.loop_count || 0;
        processedEvent = {
          title: `📚 Retrieved Knowledge (Round ${loopNum + 1})`,
          data: `Found ${newContexts} new contexts (${numContexts} total gathered)`,
        };
      } else if (event.step_status === "reflection" && !event.reflect) {
        // Reflection started but not completed
        const numContexts = event.all_contexts?.length || 0;
        const loopCount = event.research_loop_count || 0;
        processedEvent = {
          title: `💭 Evaluating Research Quality (Round ${loopCount})`,
          data: `Analyzing ${numContexts} contexts gathered so far...`,
        };
      } else if (event.reflect) {
        const sufficient = event.reflect?.sufficient || false;
        const confidence = event.reflect?.confidence || 0;
        const reasoning = event.reflect?.reasoning || "";
        const loopCount = event.reflect?.loop_count || 0;
        processedEvent = {
          title: `${sufficient ? '✅' : '🔄'} Research Analysis Complete (Round ${loopCount})`,
          data: sufficient
            ? `Confidence: ${(confidence * 100).toFixed(0)}% - Ready to generate report`
            : `Confidence: ${(confidence * 100).toFixed(0)}% - Need more research: ${reasoning.substring(0, 80)}...`,
        };
      } else if (event.step_status === "finalized" && !event.finalize_report) {
        // Finalization started
        const numContexts = event.all_contexts?.length || 0;
        const numSources = event.sources?.length || 0;
        processedEvent = {
          title: "📝 Generating Final Report...",
          data: `Synthesizing insights from ${numContexts} contexts across ${numSources} sources...`,
        };
      } else if (event.finalize_report) {
        const numContexts = event.finalize_report?.num_contexts || 0;
        const numSources = event.finalize_report?.num_sources || 0;
        processedEvent = {
          title: "📝 Generating Final Report",
          data: `Synthesizing ${numContexts} contexts from ${numSources} sources...`,
        };
        hasFinalizeEventOccurredRef.current = true;
      } else if (event.step_status === "query_generation") {
        // Thinking state before query generation completes
        processedEvent = {
          title: "🧠 Thinking...",
          data: "Analyzing question and planning search strategy...",
        };
      } else if (event.step_status === "retrieval") {
        processedEvent = {
          title: "🔎 Searching...",
          data: "Querying knowledge base...",
        };
      } else if (event.step_status === "reflection") {
        processedEvent = {
          title: "💭 Evaluating...",
          data: "Assessing research completeness and quality...",
        };
      } else if (event.step_status === "finalized") {
        // This is redundant with finalize_report, skip
        processedEvent = null;
      }
      // Legacy events (from old web research demo)
      else if (event.generate_query) {
        processedEvent = {
          title: "Generating Search Queries",
          data: event.generate_query?.search_query?.join(", ") || "",
        };
      } else if (event.web_research) {
        const sources = event.web_research.sources_gathered || [];
        const numSources = sources.length;
        const uniqueLabels = [
          ...new Set(sources.map((s: any) => s.label).filter(Boolean)),
        ];
        const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
        processedEvent = {
          title: "Web Research",
          data: `Gathered ${numSources} sources. Related to: ${
            exampleLabels || "N/A"
          }.`,
        };
      } else if (event.reflection) {
        processedEvent = {
          title: "Reflection",
          data: "Analysing Web Research Results",
        };
      } else if (event.finalize_answer) {
        processedEvent = {
          title: "Finalizing Answer",
          data: "Composing and presenting the final answer.",
        };
        hasFinalizeEventOccurredRef.current = true;
      }

      if (processedEvent) {
        setProcessedEventsTimeline((prevEvents) => [
          ...prevEvents,
          processedEvent!,
        ]);
      }
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [thread.messages]);

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
      }
      hasFinalizeEventOccurredRef.current = false;
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline]);

  const handleSubmit = useCallback(
    (submittedInputValue: string) => {
      if (!submittedInputValue.trim()) return;
      setProcessedEventsTimeline([]);
      hasFinalizeEventOccurredRef.current = false;

      const newMessages: Message[] = [
        ...(thread.messages || []),
        {
          type: "human",
          content: submittedInputValue,
          id: Date.now().toString(),
        },
      ];
      thread.submit({
        messages: newMessages,
        repository: repository,
        rag_enabled: ragEnabled,
        deep_research_mode: deepResearchMode,  // Pass DeepResearch mode
        max_research_loops: 3,
        initial_search_query_count: 3,
        reasoning_model: "gpt-4o-mini",
      });
    },
    [thread, repository, ragEnabled, deepResearchMode]
  );

  const handleCancel = useCallback(() => {
    thread.stop();
    window.location.reload();
  }, [thread]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans antialiased transition-colors duration-200">
      <main className="h-full w-full max-w-5xl mx-auto flex flex-col bg-white dark:bg-neutral-900 shadow-2xl border-x border-neutral-200 dark:border-neutral-800">
        {/* Repository Selector - Always visible at top */}
        <RepositorySelector
          currentRepo={repository}
          onRepoChange={setRepository}
          ragEnabled={ragEnabled}
          onRagToggle={setRagEnabled}
          deepResearchMode={deepResearchMode}
          onDeepResearchToggle={setDeepResearchMode}
          onManageKB={() => setShowKBManager(true)}
        />

        {/* Knowledge Base Manager Modal */}
        {showKBManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto m-4 border border-neutral-200 dark:border-neutral-800">
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Knowledge Base Manager
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKBManager(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  ✕ Close
                </Button>
              </div>
              <div className="p-6">
                <KnowledgeBaseManager
                  currentKB={repository}
                  onSelectKB={(kbId) => {
                    setRepository(kbId);
                    setShowKBManager(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {thread.messages.length === 0 ? (
            <WelcomeScreen
              handleSubmit={handleSubmit}
              isLoading={thread.isLoading}
              onCancel={handleCancel}
            />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="flex flex-col items-center justify-center gap-6 max-w-md text-center p-8 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <h2 className="text-2xl text-red-600 dark:text-red-400 font-bold">
                  Connection Error
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                  {JSON.stringify(error)}
                </p>

                <Button
                  variant="destructive"
                  onClick={() => window.location.reload()}
                  className="w-full"
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
            />
          )}
        </div>
      </main>
    </div>
  );
}
