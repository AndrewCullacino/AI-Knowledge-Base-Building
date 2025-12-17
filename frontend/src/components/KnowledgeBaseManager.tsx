import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { KnowledgeBaseUpload } from "./KnowledgeBaseUpload";

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
      console.error("Failed to load knowledge bases:", error);
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
      console.error("Failed to delete knowledge base:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Knowledge Bases
        </h2>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          variant={showUpload ? "outline" : "default"}
          size="sm"
        >
          {showUpload ? "Cancel" : "+ New Knowledge Base"}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <KnowledgeBaseUpload onUploadComplete={handleUploadComplete} />
      )}

      {/* Knowledge Bases List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            Loading knowledge bases...
          </div>
        ) : (
          <>
            {/* Default CNB Knowledge Base */}
            <Card
              className={`p-4 cursor-pointer transition-all ${
                currentKB === "cnb/docs"
                  ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
              onClick={() => onSelectKB("cnb/docs")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    📚 CNB Official Docs
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Default knowledge base (cnb/docs)
                  </p>
                </div>
                {currentKB === "cnb/docs" && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">✓ Active</span>
                )}
              </div>
            </Card>

            {/* Custom Knowledge Bases */}
            {knowledgeBases.map((kb) => (
              <Card
                key={kb.id}
                className={`p-4 cursor-pointer transition-all ${
                  currentKB === kb.id
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1" onClick={() => onSelectKB(kb.id)}>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      📁 {kb.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {kb.document_count} documents • Created {new Date(kb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentKB === kb.id && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">✓ Active</span>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(kb.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {knowledgeBases.length === 0 && !loading && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                No custom knowledge bases yet. Click "+ New Knowledge Base" to create one.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
