import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { KnowledgeBaseUpload } from "./KnowledgeBaseUpload";
import { logger } from "@/utils/logger";

interface KnowledgeBase {
  id: string;
  name: string;
  created_at: string;
  document_count: number;
}

interface KnowledgeBaseManagerProps {
  currentKB: string;
  onSelectKB: (kbId: string) => void;
}

export function KnowledgeBaseManager({ currentKB, onSelectKB }: KnowledgeBaseManagerProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Load available knowledge bases
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

  const handleUploadComplete = (kbId: string) => {
    setShowUpload(false);
    loadKnowledgeBases();
    onSelectKB(kbId);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            Knowledge Bases
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your custom knowledge bases
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className={`transition-all duration-200 ${
            showUpload
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
          size="sm"
        >
          {showUpload ? "Cancel" : "+ New Knowledge Base"}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="glass rounded-xl p-4 border border-border animate-fadeInUpSmooth">
          <KnowledgeBaseUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Knowledge Bases List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-neutral-400">Loading knowledge bases...</p>
          </div>
        ) : (
          <>
            {/* Default CNB Knowledge Base */}
            <Card
              className={`glass cursor-pointer transition-all duration-200 border ${
                currentKB === "cnb/docs"
                  ? "ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10"
                  : "border-white/10 hover:bg-white/5 hover:border-white/20"
              }`}
              onClick={() => onSelectKB("cnb/docs")}
            >
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📚</span>
                    <h3 className="font-semibold text-white text-lg">
                      CNB Official Docs
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-400">
                    Default knowledge base • Always available
                  </p>
                </div>
                {currentKB === "cnb/docs" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <span className="text-blue-400">✓</span>
                    <span className="text-blue-400 font-medium text-sm">Active</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Custom Knowledge Bases */}
            {knowledgeBases.map((kb, index) => (
              <Card
                key={kb.id}
                className={`glass cursor-pointer transition-all duration-200 border animate-fadeInUp ${
                  currentKB === kb.id
                    ? "ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 hover:bg-white/5 hover:border-white/20"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex-1" onClick={() => onSelectKB(kb.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">📁</span>
                      <h3 className="font-semibold text-white text-lg">
                        {kb.name}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-400">
                      {kb.document_count} documents • Created {new Date(kb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentKB === kb.id && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <span className="text-blue-400">✓</span>
                        <span className="text-blue-400 font-medium text-sm">Active</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(kb.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {knowledgeBases.length === 0 && !loading && (
              <div className="text-center py-12 glass rounded-xl border border-white/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-3xl">📦</span>
                </div>
                <p className="text-neutral-400 mb-2">No custom knowledge bases yet</p>
                <p className="text-sm text-neutral-500">
                  Click "+ New Knowledge Base" to create your first one
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
