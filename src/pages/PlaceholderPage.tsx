import { useNavigate } from 'react-router-dom';
import { Button, Paper } from '@mui/material';
import { Construction } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';

interface PlaceholderPageProps {
  title: string;
}

/** Stand-in for modules that are built later (Cutting, Sorting, Sewing, QC, Inventory…). */
export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title={title} />
      <Paper>
        <EmptyState
          icon={Construction}
          title={`${title} is not built yet`}
          message="This module comes after Production Orders and will reuse the same layout and components."
          action={
            <Button variant="outlined" onClick={() => navigate('/production/orders')}>
              Go to Production Orders
            </Button>
          }
        />
      </Paper>
    </>
  );
}
