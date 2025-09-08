'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { deletePollAsAdmin } from '@/lib/actions/admin-actions';
import { useRouter } from 'next/navigation';

interface AdminPollActionsProps {
  pollId: string;
}

export function AdminPollActions({ pollId }: AdminPollActionsProps) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    
    try {
      const result = await deletePollAsAdmin(pollId);
      
      if (result.success) {
        // Refresh the page to show updated data
        router.refresh();
      } else {
        alert(`Failed to delete poll: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An unexpected error occurred while deleting the poll.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleteLoading}
    >
      {deleteLoading ? "Deleting..." : "Delete"}
    </Button>
  );
}
