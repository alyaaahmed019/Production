import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Box, Link, Paper, Skeleton } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { ErrorState } from '../../components/common/ErrorState';
import { PageHeader } from '../../components/common/PageHeader';
import { WorkOrderForm } from '../../components/workOrders/WorkOrderForm';
import { WorkOrderSavedSummary } from '../../components/workOrders/WorkOrderSavedSummary';
import { useI18n } from '../../contexts/I18nContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { WorkOrderNotFoundError } from '../../services/errors';
import { getWorkOrder, getWorkOrderClients, updateWorkOrder } from '../../services/workOrdersService';
import type { WorkOrder, WorkOrderInput } from '../../types/workOrder';
import { getFormText, workOrderToFormValues } from '../../utils/workOrderForm';

/** Edit a work order saved on this device. Same form as "new", filled with the saved values. */
export default function EditWorkOrderPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const text = getFormText(locale);
  const { data, error, reload } = useAsyncData(() => getWorkOrder(id), [id]);
  const { data: clients = [] } = useAsyncData(getWorkOrderClients);
  /** The latest version saved from this page; it replaces the loaded data so editing again starts from it. */
  const [latest, setLatest] = useState<WorkOrder | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const source = latest ?? data ?? null;
  const initialValues = useMemo(() => (source ? workOrderToFormValues(source) : null), [source]);

  const handleSubmit = async (input: WorkOrderInput) => {
    setLatest(await updateWorkOrder(id, input));
    setShowSummary(true);
  };

  if (showSummary && latest) {
    return (
      <WorkOrderSavedSummary
        order={latest}
        text={text}
        locale={locale}
        title={text.savedTitle}
        successMessage={text.updatedBody}
        onEdit={() => setShowSummary(false)}
        onNew={() => navigate('/production/orders/new')}
        onBack={() => navigate('/production/orders')}
      />
    );
  }

  if (error && !data) {
    return (
      <Paper>
        <ErrorState
          title={error instanceof WorkOrderNotFoundError ? text.orderNotFound : text.loadFailed}
          message={text.back}
          onRetry={error instanceof WorkOrderNotFoundError ? undefined : reload}
        />
      </Paper>
    );
  }

  return (
    <>
      <PageHeader
        title={data ? text.editTitle(data.workOrderNumber) : text.edit}
        subtitle={text.editSubtitle}
        leading={
          <Link
            component={RouterLink}
            to="/production/orders"
            underline="hover"
            color="text.secondary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8125rem' }}
          >
            <ArrowLeft size={14} aria-hidden /> {text.back}
          </Link>
        }
      />
      {initialValues ? (
        <WorkOrderForm
          key={source?.updatedAt}
          initialValues={initialValues}
          clients={clients}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/production/orders')}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Skeleton variant="rounded" height={260} />
          <Skeleton variant="rounded" height={200} />
        </Box>
      )}
    </>
  );
}
