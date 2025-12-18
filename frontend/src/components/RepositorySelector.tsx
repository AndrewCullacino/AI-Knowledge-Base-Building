import { useState } from "react";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";

interface RepositorySelectorProps {
  currentRepo: string;
  onRepoChange: (repo: string) => void;
  ragEnabled: boolean;
  onRagToggle: (enabled: boolean) => void;
  deepResearchMode: boolean;
  onDeepResearchToggle: (enabled: boolean) => void;
  onManageKB?: () => void;
}

export function RepositorySelector({
  currentRepo,
  onRepoChange,
  ragEnabled,
  onRagToggle,
  deepResearchMode,
  onDeepResearchToggle,
  onManageKB,
}: RepositorySelectorProps) {
  const [inputRepo, setInputRepo] = useState(currentRepo);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRepo.trim()) {
      onRepoChange(inputRepo.trim());
    }
  };

  return (
    <div className="glass-light border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex items-center gap-3 justify-between">
        {/* Left section: Mode Selection */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">
            Mode:
          </label>
          <div className="inline-flex bg-muted rounded-xl p-1 gap-1 border border-border">
            <button
              onClick={() => {
                onRagToggle(false);
                onDeepResearchToggle(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                !ragEnabled
                  ? 'bg-background text-foreground shadow-md border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
              aria-pressed={!ragEnabled}
            >
              💬 GPT
            </button>
            <button
              onClick={() => {
                onRagToggle(true);
                onDeepResearchToggle(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                ragEnabled && !deepResearchMode
                  ? 'bg-background text-foreground shadow-md border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
              aria-pressed={ragEnabled && !deepResearchMode}
            >
              📚 RAG
            </button>
            <button
              onClick={() => {
                onRagToggle(true);
                onDeepResearchToggle(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                deepResearchMode
                  ? 'bg-background text-foreground shadow-md border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
              aria-pressed={deepResearchMode}
            >
              🔬 DeepResearch
            </button>
          </div>
        </div>

        {/* Middle section: Repository Selector - Only show when RAG is enabled */}
        {ragEnabled && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-px bg-border flex-shrink-0" />
            <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0 max-w-xl">
              <label
                htmlFor="repo-input"
                className="text-sm font-medium text-foreground whitespace-nowrap flex-shrink-0"
              >
                KB:
              </label>
              <input
                id="repo-input"
                type="text"
                value={inputRepo}
                onChange={(e) => setInputRepo(e.target.value)}
                placeholder="cnb/docs"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-neutral-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 flex-shrink-0"
              >
                Switch
              </Button>
              {onManageKB && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onManageKB}
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all duration-200 flex-shrink-0 border border-neutral-200 dark:border-white/10"
                >
                  📁 Manage
                </Button>
              )}
            </form>
          </div>
        )}

        {/* Right section: Theme Toggle + Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all duration-200 border border-neutral-200 dark:border-white/10"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Current Status - Hidden on small screens */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap hidden lg:block">
            {deepResearchMode
              ? `🔬 ${currentRepo}`
              : ragEnabled
              ? `📚 ${currentRepo}`
              : "💬 Direct GPT"}
          </div>
        </div>
      </div>
    </div>
  );
}
