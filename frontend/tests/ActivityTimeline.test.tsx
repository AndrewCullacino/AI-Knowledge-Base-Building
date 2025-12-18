/**
 * Tests for ActivityTimeline component
 * Verifies research step visualization works correctly
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityTimeline, ProcessedEvent } from '../src/components/ActivityTimeline';

describe('ActivityTimeline', () => {
  it('renders timeline header', () => {
    const events: ProcessedEvent[] = [];
    render(<ActivityTimeline processedEvents={events} isLoading={false} />);

    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('displays query generation events correctly', () => {
    const events: ProcessedEvent[] = [
      {
        title: 'Generating Search Queries',
        data: '"query 1", "query 2", "query 3"',
        model: 'GPT-4o-mini'
      }
    ];

    render(<ActivityTimeline processedEvents={events} isLoading={false} />);

    // Verify event is displayed
    expect(screen.getByText(/Generating Search Queries/i)).toBeInTheDocument();
    expect(screen.getByText('GPT-4o-mini')).toBeInTheDocument();
  });

  it('displays knowledge base search events', () => {
    const events: ProcessedEvent[] = [
      {
        title: 'Knowledge Base Search',
        data: 'Gathered 10 sources from knowledge base.'
      }
    ];

    render(<ActivityTimeline processedEvents={events} isLoading={false} />);

    expect(screen.getByText(/Knowledge Base Search/i)).toBeInTheDocument();
    expect(screen.getByText(/10 sources/i)).toBeInTheDocument();
  });

  it('displays reflection events', () => {
    const events: ProcessedEvent[] = [
      {
        title: 'Reflection',
        data: 'Research complete. Confidence: 90%',
        model: 'GPT-4o'
      }
    ];

    render(<ActivityTimeline processedEvents={events} isLoading={false} />);

    expect(screen.getByText(/Reflection/i)).toBeInTheDocument();
    expect(screen.getByText(/90%/i)).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    const events: ProcessedEvent[] = [
      {
        title: 'Generating Search Queries',
        data: 'Analyzing question...'
      }
    ];

    render(<ActivityTimeline processedEvents={events} isLoading={true} />);

    // Should show loading state
    expect(screen.getByText(/Searching\.\.\./i)).toBeInTheDocument();
  });

  it('handles multiple events in sequence', () => {
    const events: ProcessedEvent[] = [
      { title: 'Generating Search Queries', data: 'queries', model: 'GPT-4o-mini' },
      { title: 'Knowledge Base Search', data: 'Gathered 5 sources' },
      { title: 'Reflection', data: 'Need more info', model: 'GPT-4o' },
      { title: 'Generating Answer', data: 'Synthesizing...', model: 'GPT-4o' }
    ];

    render(<ActivityTimeline processedEvents={events} isLoading={false} />);

    // All events should be present
    expect(screen.getByText(/Generating Search Queries/i)).toBeInTheDocument();
    expect(screen.getByText(/Knowledge Base Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Reflection/i)).toBeInTheDocument();
    expect(screen.getByText(/Generating Answer/i)).toBeInTheDocument();
  });

  it('displays empty state when no events', () => {
    render(<ActivityTimeline processedEvents={[]} isLoading={false} />);

    expect(screen.getByText(/Research timeline will appear here/i)).toBeInTheDocument();
  });
});
