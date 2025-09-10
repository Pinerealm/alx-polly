'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { PollResults } from '@/app/lib/types';

export function usePollResults(pollId: string) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch poll results from server endpoint
      const response = await fetch(`/api/polls/${pollId}/results`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch poll results');
        return;
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError('Failed to fetch poll results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pollId) return;

    // Initial fetch
    fetchResults();

    // Set up real-time subscription for votes
    const votesSubscription = supabase
      .channel(`poll-${pollId}-votes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          // Refetch results when votes change
          fetchResults();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      votesSubscription.unsubscribe();
    };
  }, [pollId]);

  return {
    results,
    loading,
    error,
    refetch: fetchResults,
  };
}
