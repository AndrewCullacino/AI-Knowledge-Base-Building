import { useState } from "react";
import { Button } from "./ui/button";

interface RepositorySelectorProps {
  currentRepo: string;
  onRepoChange: (repo: string) => void;
  ragEnabled: boolean;
  onRagToggle: (enabled: boolean) => void;
}

export function RepositorySelector({
  currentRepo,
  onRepoChange,
  ragEnabled,
  onRagToggle,
}: RepositorySelectorProps) {
  const [inputRepo, setInputRepo] = useState(currentRepo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRepo.trim()) {
      onRepoChange(inputRepo.trim());
    }
  };

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
      <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
        {/* RAG Mode Toggle */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Mode:
          </label>
          <Button
            variant={ragEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onRagToggle(!ragEnabled)}
            className="min-w-[100px]"
          >
            {ragEnabled ? "📚 RAG" : "💬 GPT"}
          </Button>
        </div>

        {/* Repository Selector - Only show when RAG is enabled */}
        {ragEnabled && (
          <>
            <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700" />
            <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-[300px]">
              <label
                htmlFor="repo-input"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              >
                Knowledge Base:
              </label>
              <input
                id="repo-input"
                type="text"
                value={inputRepo}
                onChange={(e) => setInputRepo(e.target.value)}
                placeholder="e.g., cnb/docs or your/repo"
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <Button type="submit" size="sm" variant="secondary">
                Switch
              </Button>
            </form>
          </>
        )}

        {/* Current Status */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
          {ragEnabled ? `Using: ${currentRepo}` : "Direct GPT Mode"}
        </div>
      </div>
    </div>
  );
}
