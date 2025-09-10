'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PollResults as PollResultsType } from '@/app/lib/types';

interface PollResultsProps {
  results: PollResultsType;
}

export function PollResults({ results }: PollResultsProps) {
  const { poll, results: voteResults, total_votes, has_user_voted, user_vote } = results;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          <div className="text-sm text-slate-500">
            {total_votes} total vote{total_votes !== 1 ? 's' : ''}
            {has_user_voted && user_vote !== undefined && (
              <span className="ml-2 text-blue-600">
                • You voted for "{poll.options[user_vote]}"
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {voteResults.map((result, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{result.option_text}</span>
                <div className="text-sm text-slate-500">
                  {result.vote_count} vote{result.vote_count !== 1 ? 's' : ''} ({result.percentage}%)
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={result.percentage} 
                  className="h-2"
                />
                {has_user_voted && user_vote === result.option_index && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {total_votes === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-slate-500">No votes yet. Be the first to vote!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
