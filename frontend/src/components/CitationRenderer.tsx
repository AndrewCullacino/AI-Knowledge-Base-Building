import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { ChevronDown, ChevronUp, FileText, ExternalLink, Book, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Source {
    id: number;
    title: string;
    url: string;
    path?: string;  // Optional: file path in repository
    content?: string; // Optional: snippet of the source content
    source?: string; // Optional: source type (e.g., "wikipedia", "cnb")
}

interface CitationRendererProps {
    content: string;    // Text with [1], [2], etc and markdown
    sources: Source[];
}

export function CitationRenderer ({content, sources}: CitationRendererProps) {
    const [showSources, setShowSources] = useState(true);
    const [expandedSource, setExpandedSource] = useState<number | null>(null);
    
    // Safety check: ensure sources is defined
    const safeSources = sources || [];

    // Custom component to render citations inline within text
    const renderTextWithCitations = (text: string) => {
        const parts = text.split(/(\[\d+\])/g);

        return parts.map((part, index) => {
            const match = part.match(/\[(\d+)\]/);

            if (match) {
                const citationNumber = match[1];
                const sourceIndex = parseInt(citationNumber) - 1;
                const source = safeSources[sourceIndex];

                if (source) {
                    return (
                        <sup key={index}>
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="citation-link inline-flex items-center justify-center w-4 h-4 text-[10px] rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer ml-0.5 no-underline"
                                title={source.title}
                            >
                                {citationNumber}
                            </a>
                        </sup>
                    );
                } else {
                    return <span key={index} className="text-muted-foreground">[{citationNumber}]</span>;
                }
            }

            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    // Custom markdown components with citation handling
    const components: Components = {
        // Handle paragraphs - process children for citations
        p: ({ children }) => {
            const processChildren = (child: React.ReactNode): React.ReactNode => {
                if (typeof child === 'string') {
                    return renderTextWithCitations(child);
                }
                return child;
            };
            const processedChildren = React.Children.map(children, processChildren);
            return <p className="mb-3 leading-7">{processedChildren}</p>;
        },
        strong: ({ children }) => {
            return <strong className="font-semibold">{children}</strong>;
        },
        em: ({ children }) => {
            return <em className="italic">{children}</em>;
        },
        li: ({ children }) => {
            const processChildren = (child: React.ReactNode): React.ReactNode => {
                if (typeof child === 'string') {
                    return renderTextWithCitations(child);
                }
                return child;
            };
            const processedChildren = React.Children.map(children, processChildren);
            return <li className="mb-1">{processedChildren}</li>;
        },
        h1: ({ children }) => {
            return <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>;
        },
        h2: ({ children }) => {
            return <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>;
        },
        h3: ({ children }) => {
            return <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>;
        },
        ul: ({ children }) => {
            return <ul className="list-disc pl-6 mb-3">{children}</ul>;
        },
        ol: ({ children }) => {
            return <ol className="list-decimal pl-6 mb-3">{children}</ol>;
        },
        blockquote: ({ children }) => {
            return <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-sm text-muted-foreground">{children}</blockquote>;
        },
        code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
                return <code className={`${className} block bg-muted p-3 rounded-lg overflow-x-auto text-xs my-2`}>{children}</code>;
            }
            return <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs">{children}</code>;
        },
    };

    // Get icon for source type
    const getSourceIcon = (source: Source) => {
        // Check if Wikipedia source
        if (source.source === 'wikipedia' || source.url?.includes('wikipedia.org')) {
            return <Globe className="h-3.5 w-3.5" />;
        }
        // CNB or other documentation sources
        if (source.path?.includes('README') || source.path?.includes('.md')) {
            return <Book className="h-3.5 w-3.5" />;
        }
        return <FileText className="h-3.5 w-3.5" />;
    };

    // Extract filename from path or determine source label
    const getFileName = (source: Source) => {
        // Wikipedia sources - show article title with Wikipedia prefix
        if (source.source === 'wikipedia' || source.url?.includes('wikipedia.org')) {
            return source.title;
        }
        // CNB or file-based sources - show filename
        if (source.path) {
            return source.path.split('/').pop() || source.path;
        }
        return source.title;
    };

    // Get source type badge
    const getSourceTypeBadge = (source: Source) => {
        if (source.source === 'wikipedia' || source.url?.includes('wikipedia.org')) {
            return (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Wikipedia
                </Badge>
            );
        }
        if (source.path || source.url?.includes('docs.cnb.cool')) {
            return (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-500/10 text-purple-600 border-purple-500/30">
                    CNB Docs
                </Badge>
            );
        }
        return null;
    };

  return (
    <div className="citation-content">
      {/* Main content with inline citations and markdown rendering */}
      <div className="message-text leading-relaxed">
        <ReactMarkdown components={components}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Source bibliography - Enhanced design */}
      {safeSources.length > 0 && (
        <div className="sources-section mt-6 pt-4 border-t border-border/50">
          {/* Sources Header */}
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full mb-3"
          >
            <Book className="h-4 w-4 text-muted-foreground" />
            <span>Sources</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {safeSources.length}
            </Badge>
            <span className="ml-auto">
              {showSources ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          </button>

          {/* Sources List */}
          {showSources && (
            <div className="space-y-2">
              {safeSources.map((source, index) => (
                <div 
                  key={source.id} 
                  className="source-item rounded-lg border border-border/50 bg-muted/30 overflow-hidden transition-all"
                >
                  {/* Source Header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedSource(expandedSource === index ? null : index)}
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                      {source.id}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {getSourceIcon(source)}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {getFileName(source)}
                      </span>
                      {getSourceTypeBadge(source)}
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1"
                      onClick={(e) => e.stopPropagation()}
                      title="Open source"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-muted-foreground flex-shrink-0">
                      {expandedSource === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </div>

                  {/* Expanded Source Details */}
                  {expandedSource === index && (
                    <div className="px-3 py-2 border-t border-border/30 bg-muted/20 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground font-medium min-w-[50px]">Title:</span>
                          <span className="text-foreground">{source.title}</span>
                        </div>
                        {source.path && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-medium min-w-[50px]">Path:</span>
                            <span className="text-foreground font-mono text-[11px]">{source.path}</span>
                          </div>
                        )}
                        {source.content && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            <span className="text-muted-foreground font-medium block mb-1">Preview:</span>
                            <p className="text-foreground/80 leading-relaxed line-clamp-3">
                              {source.content.substring(0, 200)}...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

}