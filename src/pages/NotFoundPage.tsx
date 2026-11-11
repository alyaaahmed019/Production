import { useNavigate } from 'react-router-dom';
import { Button, Paper } from '@mui/material';
import { FileQuestion } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Paper>
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        message="The address doesn't match any page in the system."
        action={
          <Button variant="contained" onClick={() => navigate('/production/orders')}>
            Go to Production Orders
          </Button>
        }
      />
    </Paper>
  );
}
