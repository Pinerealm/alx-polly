'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Poll } from '@/app/lib/types';

export default function PollDetailPage({ params }: any) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const response = await fetch(`/api/polls/${params.id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ optionIndex: selectedOption }),
    });

    if (response.ok) {
      setHasVoted(true);
    } else {
      const data = await response.json();
      setError(data.error || "Something went wrong.");
    }

    setIsSubmitting(false);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!poll) {
    return <div>Loading...</div>;
  }

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
              <Button
                onClick={handleVote}
                disabled={selectedOption === null || isSubmitting}
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              <div>Thank you for voting!</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by user: {poll.user_id}</span>
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
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
