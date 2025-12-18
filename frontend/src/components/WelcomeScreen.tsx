import { InputForm } from "./InputForm";

interface WelcomeScreenProps {
  handleSubmit: (submittedInputValue: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
}) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6 flex-1 w-full max-w-3xl mx-auto">
    {/* Logo/Icon Area - Removed for cleaner look */}
    
    {/* Title Section */}
    <div className="mb-8 animate-fadeInUp animation-delay-100">
      <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4 tracking-tight">
        Good afternoon
      </h1>
    </div>

    {/* Input Form */}
    <div className="w-full max-w-2xl animate-fadeInUp animation-delay-200">
      <InputForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={onCancel}
        hasHistory={false}
      />
    </div>

    {/* Suggestion Chips */}
    <div className="flex flex-wrap items-center justify-center gap-3 mt-6 animate-fadeInUp animation-delay-300">
      <button
        onClick={() => handleSubmit("What can you help me with?")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground transition-all duration-200"
      >
        <span className="text-base">💡</span> Write
      </button>
      <button
        onClick={() => handleSubmit("Explain how RAG mode works")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground transition-all duration-200"
      >
        <span className="text-base">📚</span> Learn
      </button>
      <button
        onClick={() => handleSubmit("Tell me about DeepResearch mode")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground transition-all duration-200"
      >
        <span className="text-base">🔬</span> Code
      </button>
    </div>
  </div>
);
