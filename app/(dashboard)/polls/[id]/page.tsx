'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Poll, PollResults } from '@/app/lib/types';
import { PollResults as PollResultsComponent } from '@/app/components/PollResults';
import { usePollResults } from '@/app/hooks/usePollResults';

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use real-time poll results hook
  const { results: pollResults, loading: isLoadingResults, error: resultsError, refetch } = usePollResults(params.id);

  useEffect(() => {
    const fetchPoll = async () => {
      const response = await fetch(`/api/polls/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        setPoll(data.poll);
      }
    };

    if (params.id) {
      fetchPoll();
    }
  }, [params.id]);

  const handleVote = async () => {
    if (selectedOption === null) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/polls/${params.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionIndex: selectedOption }),
      });

      if (response.ok) {
        // Results will be updated automatically via real-time subscription
        // No need to manually refresh
      } else {
        const data = await response.json();
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error || resultsError) {
    return <div>Error: {error || resultsError}</div>;
  }

  if (!poll) {
    return <div>Loading...</div>;
  }

  const hasVoted = pollResults?.has_user_voted || false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${params.id}/edit`}>Edit Poll</Link>
          </Button>
          <Button variant="outline" className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedOption === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleVote}
                  disabled={selectedOption === null || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </Button>
                <Button
                  variant="outline"
                  onClick={refetch}
                  disabled={isLoadingResults}
                >
                  {isLoadingResults ? 'Loading...' : 'View Results'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingResults ? (
                <div className="text-center py-4">Loading results...</div>
              ) : pollResults ? (
                <PollResultsComponent results={pollResults} />
              ) : (
                <div className="text-center py-4">Failed to load results</div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by user: {poll.user_id}</span>
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
          {poll.expires_at && (
            <span>
              Expires on {new Date(poll.expires_at).toLocaleDateString()} at{' '}
              {new Date(poll.expires_at).toLocaleTimeString()}
            </span>
          )}
        </CardFooter>
      </Card>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}
