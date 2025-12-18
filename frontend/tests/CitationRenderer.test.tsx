/**
 * Tests for CitationRenderer component
 * Verifies citation display and source linking works correctly
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CitationRenderer } from '../src/components/CitationRenderer';

describe('CitationRenderer', () => {
  it('renders content without citations', () => {
    const content = 'This is plain text without citations.';
    const sources: any[] = [];

    render(<CitationRenderer content={content} sources={sources} />);

    expect(screen.getByText(/plain text/i)).toBeInTheDocument();
  });

  it('renders content with citations correctly', () => {
    const content = 'CNB is a platform [1]. It provides APIs [2].';
    const sources = [
      { title: 'CNB Intro', path: '/intro', url: 'https://docs.cnb.cool/intro' },
      { title: 'CNB API', path: '/api', url: 'https://docs.cnb.cool/api' }
    ];

    render(<CitationRenderer content={content} sources={sources} />);

    // Content should be rendered
    expect(screen.getByText(/CNB is a platform/i)).toBeInTheDocument();
    expect(screen.getByText(/provides APIs/i)).toBeInTheDocument();
  });

  it('renders sources list when citations present', () => {
    const content = 'Test with citation [1].';
    const sources = [
      { title: 'Source 1', path: '/s1', url: 'https://example.com/s1' }
    ];

    render(<CitationRenderer content={content} sources={sources} />);

    // Sources section should be present
    expect(screen.getByText(/Source 1/i)).toBeInTheDocument();
  });

  it('handles multiple citations correctly', () => {
    const content = 'First fact [1]. Second fact [2]. Third fact [3].';
    const sources = [
      { title: 'Source 1', path: '/s1', url: 'https://example.com/s1' },
      { title: 'Source 2', path: '/s2', url: 'https://example.com/s2' },
      { title: 'Source 3', path: '/s3', url: 'https://example.com/s3' }
    ];

    render(<CitationRenderer content={content} sources={sources} />);

    // All sources should be rendered
    expect(screen.getByText(/Source 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Source 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Source 3/i)).toBeInTheDocument();
  });

  it('handles markdown formatting in content', () => {
    const content = '**Bold text** with citation [1].';
    const sources = [
      { title: 'Source', path: '/s', url: 'https://example.com/s' }
    ];

    render(<CitationRenderer content={content} sources={sources} />);

    // Markdown should be rendered (bold text should be present)
    expect(screen.getByText(/Bold text/i)).toBeInTheDocument();
  });
});
