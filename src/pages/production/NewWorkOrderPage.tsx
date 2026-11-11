import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Link } from '@mui/material';
import { ArrowLeft, FileDown } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { WorkOrderForm } from '../../components/workOrders/WorkOrderForm';
import { WorkOrderSavedSummary } from '../../components/workOrders/WorkOrderSavedSummary';
import { useI18n } from '../../contexts/I18nContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { createWorkOrder, getWorkOrderClients } from '../../services/workOrdersService';
import { tokens } from '../../theme';
import type { WorkOrder, WorkOrderInput } from '../../types/workOrder';
import { todayIso } from '../../utils/format';
import { emptyFormValues, formValuesToInput, getFormText, type WorkOrderFormValues } from '../../utils/workOrderForm';
import { printWorkOrder } from '../../utils/printWorkOrder';

export default function NewWorkOrderPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const text = getFormText(locale);
  const { data: clients = [] } = useAsyncData(getWorkOrderClients);
  const [saved, setSaved] = useState<WorkOrder | null>(null);
  const [formKey, setFormKey] = useState(0);
  // A new key gives a fresh, empty form for "New order".
  const initialValues = useMemo(() => emptyFormValues(todayIso()), [formKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [currentValues, setCurrentValues] = useState<WorkOrderFormValues>(initialValues);

  useEffect(() => {
    setCurrentValues(initialValues);
  }, [initialValues]);

  const handleSubmit = async (input: WorkOrderInput) => {
    const order = await createWorkOrder(input);
    setSaved(order);
  };

  const handleExportPdf = () => {
    const input = formValuesToInput(currentValues);
    const order: WorkOrder = {
      ...input,
      id: 'preview',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '',
      updatedBy: '',
    };
    printWorkOrder(order, locale);
  };

  if (saved) {
    return (
      <WorkOrderSavedSummary
        order={saved}
        text={text}
        locale={locale}
        title={text.savedTitle}
        successMessage={text.savedBody}
        onEdit={() => navigate(`/production/work-orders/${saved.id}/edit`)}
        onNew={() => {
          setSaved(null);
          setFormKey((key) => key + 1);
        }}
        onBack={() => navigate('/production/orders')}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={text.pageTitle}
        subtitle={text.pageSubtitle}
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
        actions={
          <Button
            variant="contained"
            startIcon={<FileDown size={18} />}
            onClick={handleExportPdf}
            sx={{
              bgcolor: tokens.ink,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2.2,
              py: 1,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: tokens.inkRaised,
                boxShadow: 'none',
              },
            }}
          >
            {text.exportPdf}
          </Button>
        }
      />
      <WorkOrderForm
        key={formKey}
        initialValues={initialValues}
        clients={clients}
        onValuesChange={setCurrentValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/production/orders')}
      />
    </>
  );
}
