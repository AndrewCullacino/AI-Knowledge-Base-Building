import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface Source {
    id: number;
    title: string;
    url: string;
    path?: string;  // Optional: file path in repository
}

interface CitationRendererProps {
    content: string;    // Text with [1], [2], etc and markdown
    sources: Source[];
}

export function CitationRenderer ({content, sources}: CitationRendererProps) {
    // Safety check: ensure sources is defined
    const safeSources = sources || [];

    // Debug logging
    console.log('CitationRenderer - content:', content);
    console.log('CitationRenderer - sources:', safeSources);

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
                                className="citation-link"
                                title={source.title}
                                style={{
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    padding: '0 2px',
                                    marginLeft: '2px'
                                }}
                            >
                                [{citationNumber}]
                            </a>
                        </sup>
                    );
                } else {
                    return <span key={index}>[{citationNumber}]</span>;
                }
            }

            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    // Custom markdown components with citation handling
    const components: Components = {
        // Handle text nodes to process citations
        p: ({ children }) => {
            return <p className="mb-3 leading-7">{children}</p>;
        },
        strong: ({ children }) => {
            return <strong className="font-semibold">{children}</strong>;
        },
        em: ({ children }) => {
            return <em className="italic">{children}</em>;
        },
        li: ({ children }) => {
            return <li className="mb-1">{children}</li>;
        },
        // Process text to handle citations
        text: ({ value }: { value: string }) => {
            return <>{renderTextWithCitations(value)}</>;
        }
    };

  return (
    <div className="citation-content">
      {/* Main content with inline citations and markdown rendering */}
      <div className="message-text" style={{ lineHeight: '1.6' }}>
        <ReactMarkdown components={components}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Source bibliography */}
      {safeSources.length > 0 && (
        <div
          className="sources-list"
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.875rem'
          }}
        >
          <h4 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: '#6b7280'
          }}>
            Sources:
          </h4>
          <ol style={{
            paddingLeft: '1.5rem',
            margin: 0
          }}>
            {safeSources.map((source) => (
              <li key={source.id} style={{ marginBottom: '0.5rem' }}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  {source.title}
                </a>
                {source.path && (
                  <span
                    className="source-path"
                    style={{
                      color: '#9ca3af',
                      fontSize: '0.8rem'
                    }}
                  >
                    {' '}({source.path})
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );

}