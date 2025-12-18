import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the component tree.
 * Prevents the entire app from crashing and shows a user-friendly error UI.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    logger.error("🚨 React Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {this.state.error && (
              <details className="text-left bg-card p-4 rounded-lg border border-border">
                <summary className="cursor-pointer font-medium text-foreground mb-2">
                  Error Details
                </summary>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-mono text-xs break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs overflow-auto max-h-40 bg-muted p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
