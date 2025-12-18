import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface KnowledgeBaseUploadProps {
  onUploadComplete: (kbId: string) => void;
}

export function KnowledgeBaseUpload({ onUploadComplete }: KnowledgeBaseUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://localhost:2024/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setProgress(100);

      // Notify parent component
      onUploadComplete(result.kb_id);

      // Reset form
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          📁 Upload Knowledge Base
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload documents to create your custom knowledge base. Supported formats: PDF, TXT, MD, DOCX
        </p>
      </div>

      {/* File Input */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.docx,.doc"
          onChange={handleFileSelect}
          className="flex-1 text-sm text-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20
            dark:file:bg-primary/20 dark:file:text-primary
            dark:hover:file:bg-primary/30"
        />
        <Button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          variant="default"
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Selected files ({selectedFiles.length}):
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-sm"
              >
                <span className="truncate flex-1 text-neutral-700 dark:text-neutral-300">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
            Processing files... {progress}%
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </Card>
  );
}
