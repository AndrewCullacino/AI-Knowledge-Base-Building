import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "../contexts/ThemeContext";
import { logger } from "@/utils/logger";
import type { Conversation } from "@/types/conversation";
import {
  Plus,
  MessageSquare,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface KnowledgeBase {
  id: string;
  name: string;
  created_at: string;
  document_count: number;
}

interface SidebarProps {
  currentKB: string;
  onSelectKB: (kbId: string) => void;
  onNewChat: () => void;
  ragEnabled: boolean;
  onRagToggle: (enabled: boolean) => void;
  deepResearchMode: boolean;
  onDeepResearchToggle: (enabled: boolean) => void;
  showProjectsView: boolean;
  onToggleProjectsView: (show: boolean) => void;
  knowledgeBaseType: string;
  onKnowledgeBaseTypeChange: (type: string) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  onDeleteConversation: (convId: string) => void;
  conversationsLoading: boolean;
  onSelectCustomKB: (kbId: string, kbName: string) => void;  // Fix 3: NEW prop
  activeKBName: string;  // Fix 3: NEW prop
}

export function Sidebar({
  currentKB,
  onSelectKB,
  onNewChat,
  ragEnabled,
  onRagToggle,
  deepResearchMode,
  onDeepResearchToggle,
  showProjectsView,
  onToggleProjectsView,
  knowledgeBaseType,
  onKnowledgeBaseTypeChange,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  conversationsLoading,
  onSelectCustomKB,  // Fix 3: NEW prop
  activeKBName,      // Fix 3: NEW prop
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [recentsExpanded, setRecentsExpanded] = useState(true);

  // Load knowledge bases
  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:2024/api/knowledge-base/list");
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data.knowledge_bases || []);
      }
    } catch (error) {
      logger.error("Failed to load knowledge bases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (kbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete knowledge base "${kbId}"? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:2024/api/knowledge-base/${kbId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadKnowledgeBases();
        if (currentKB === kbId) {
          onSelectKB("cnb/docs");
        }
      }
    } catch (error) {
      logger.error("Failed to delete knowledge base:", error);
    }
  };

  return (
    <div className="w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Knowledge AI</h1>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        <button
          onClick={() => onToggleProjectsView(false)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            !showProjectsView
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Chats
        </button>

        <button
          onClick={() => onToggleProjectsView(true)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            showProjectsView
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          Projects
        </button>
      </nav>

      {/* Recents Section */}
      {!showProjectsView && (
        <div className="flex-1 overflow-hidden flex flex-col px-3 pt-4">
          <button
            onClick={() => setRecentsExpanded(!recentsExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors"
          >
            {recentsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Recents
          </button>

          {recentsExpanded && (
            <ScrollArea className="flex-1">
              <div className="space-y-1 pb-4">
                {conversationsLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
                        currentConversationId === conv.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{conv.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete conversation "${conv.title}"?`)) {
                              onDeleteConversation(conv.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-destructive/20 text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Mode Selection */}
      <div className="px-3 py-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3">Mode</p>
        <div className="space-y-1">
          <button
            onClick={() => {
              onRagToggle(false);
              onDeepResearchToggle(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              !ragEnabled
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <span>💬</span>
            GPT Mode
          </button>
          <button
            onClick={() => {
              onRagToggle(true);
              onDeepResearchToggle(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              ragEnabled && !deepResearchMode
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <span>📚</span>
            RAG Mode
          </button>
          <button
            onClick={() => {
              onRagToggle(true);
              onDeepResearchToggle(true);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              deepResearchMode
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <span>🔬</span>
            DeepResearch
          </button>
        </div>
      </div>

      {/* Knowledge Base Type Selection */}
      {ragEnabled && (
        <div className="px-3 pb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3">Knowledge Source</p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onKnowledgeBaseTypeChange("wikipedia");
                onSelectCustomKB("", "Wikipedia");  // Update active KB name
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                knowledgeBaseType === "wikipedia"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <span>📖</span>
              <div className="flex-1 text-left">
                <div className="font-medium">Wikipedia</div>
                <div className="text-xs opacity-70">General knowledge</div>
              </div>
              {knowledgeBaseType === "wikipedia" && (
                <span className="text-xs">✓</span>
              )}
            </button>
            <button
              onClick={() => {
                onKnowledgeBaseTypeChange("cnb");
                onSelectCustomKB("cnb/docs", "CNB Docs");  // Update active KB name
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                knowledgeBaseType === "cnb"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <span>📚</span>
              <div className="flex-1 text-left">
                <div className="font-medium">CNB Docs</div>
                <div className="text-xs opacity-70">Technical documentation</div>
              </div>
              {knowledgeBaseType === "cnb" && (
                <span className="text-xs">✓</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Knowledge Bases / Projects Section */}
      {ragEnabled && (
        <div className="flex-1 overflow-hidden flex flex-col px-3">
          {/* Fix 5: Active KB Indicator */}
          <div className="px-3 py-2 mb-2 bg-sidebar-accent/30 border-l-2 border-primary rounded-r">
            <p className="text-xs text-muted-foreground">Active Knowledge Base</p>
            <p className="text-sm font-medium text-primary truncate">{activeKBName}</p>
          </div>

          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors"
          >
            {projectsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Knowledge Bases
          </button>

          {projectsExpanded && (
            <ScrollArea className="flex-1">
              <div className="space-y-1 pb-4">
                {/* Default KB */}
                <button
                  onClick={() => {
                    if (currentKB === "cnb/docs") {
                      // Deactivate - switch to GPT mode
                      onSelectKB("");
                      onRagToggle(false);
                      onDeepResearchToggle(false);
                    } else {
                      onSelectKB("cnb/docs");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                    currentKB === "cnb/docs"
                      ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/30"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <span>📚</span>
                  <span className="truncate flex-1 text-left">CNB Docs</span>
                  {currentKB === "cnb/docs" && (
                    <span className="text-xs text-sidebar-primary">✓</span>
                  )}
                </button>

                {/* Custom KBs */}
                {knowledgeBases.map((kb) => (
                  <div
                    key={kb.id}
                    onClick={() => {
                      if (currentKB === kb.id) {
                        // Deactivate - switch to GPT mode
                        onSelectKB("");
                        onRagToggle(false);
                        onDeepResearchToggle(false);
                      } else {
                        // Fix 3: Set type to "custom" and call custom KB handler
                        onKnowledgeBaseTypeChange("custom");
                        onSelectCustomKB(kb.id, kb.name);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
                      knowledgeBaseType === "custom" && currentKB === kb.id
                        ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/30"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <span>📁</span>
                    <span className="truncate flex-1 text-left">{kb.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        onClick={(e) => handleDelete(kb.id, e)}
                        className="p-1 rounded hover:bg-destructive/20 text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </div>
                    </div>
                    {knowledgeBaseType === "custom" && currentKB === kb.id && (
                      <span className="text-xs text-sidebar-primary">● Active</span>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User/Settings Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-foreground">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">User</p>
            <p className="text-xs text-muted-foreground truncate">
              {deepResearchMode ? "🔬 DeepResearch" : ragEnabled ? `📚 ${currentKB}` : "💬 GPT"}
            </p>
          </div>
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
