"use client";

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import EditPollForm from './EditPollForm';
import { Poll } from '@/app/lib/types';

export default function EditPollPage({ params }: any) {
  const [poll, setPoll] = useState<Poll | null>(null);
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

  if (error) {
    notFound();
  }

  if (!poll) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}