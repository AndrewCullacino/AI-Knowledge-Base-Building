import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { KnowledgeBaseUpload } from "./KnowledgeBaseUpload";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { logger } from "@/utils/logger";

interface KnowledgeBase {
  id: string;
  name: string;
  created_at: string;
  document_count: number;
}

interface ProjectsViewProps {
  currentKB: string;
  onSelectKB: (kbId: string) => void;
  onBackToChat: () => void;
  onUploadComplete: (kbId: string, kbName: string) => void;  // Fix 6: NEW prop
}

export function ProjectsView({ currentKB, onSelectKB, onBackToChat, onUploadComplete }: ProjectsViewProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "archived">("all");

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

  const handleUploadComplete = (kbId: string, kbName: string) => {
    setShowUpload(false);
    loadKnowledgeBases();
    onUploadComplete(kbId, kbName);  // Fix 6: Pass both to parent
  };

  const handleDelete = async (kbId: string) => {
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

  const filteredKBs = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Updated today";
    if (days === 1) return "Updated 1 day ago";
    if (days < 30) return `Updated ${days} days ago`;
    if (days < 60) return "Updated 1 month ago";
    return `Updated ${Math.floor(days / 30)} months ago`;
  };

  return (
    <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-foreground">Projects</h1>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="gap-2"
          variant={showUpload ? "secondary" : "default"}
        >
          <Plus className="h-4 w-4" />
          {showUpload ? "Cancel" : "New project"}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="mb-8 p-6 bg-card rounded-xl border border-border animate-fadeInUpSmooth">
          <KnowledgeBaseUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Your projects
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "archived"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Archived
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sort by</span>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors">
            Activity
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default CNB KB Card */}
          <Card
            onClick={() => {
              if (currentKB === "cnb/docs") {
                // Deactivate
                onSelectKB("");
              } else {
                onSelectKB("cnb/docs");
              }
              onBackToChat();
            }}
            className={`p-6 cursor-pointer transition-all duration-200 hover:bg-muted/50 group ${
              currentKB === "cnb/docs" ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">CNB Official Docs</h3>
              {currentKB === "cnb/docs" && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Default knowledge base • Click to {currentKB === "cnb/docs" ? "deactivate" : "activate"}</p>
          </Card>

          {/* Custom KB Cards */}
          {filteredKBs.map((kb, index) => (
            <Card
              key={kb.id}
              onClick={() => {
                if (currentKB === kb.id) {
                  // Deactivate
                  onSelectKB("");
                } else {
                  onSelectKB(kb.id);
                }
                onBackToChat();
              }}
              className={`p-6 cursor-pointer transition-all duration-200 hover:bg-muted/50 group animate-fadeInUp ${
                currentKB === kb.id ? "ring-2 ring-primary" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">{kb.name}</h3>
                <div className="flex items-center gap-2">
                  {currentKB === kb.id && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(kb.id);
                    }}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(kb.created_at)}
              </p>
            </Card>
          ))}

          {/* Empty State */}
          {filteredKBs.length === 0 && !loading && searchQuery && (
            <div className="col-span-2 py-16 text-center text-muted-foreground">
              <p>No projects found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
