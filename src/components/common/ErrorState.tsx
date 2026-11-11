import { Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      message={message}
      action={
        onRetry && (
          <Button variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
