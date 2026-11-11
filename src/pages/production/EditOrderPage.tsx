import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Box, Link, Paper, Skeleton } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { ErrorState } from '../../components/common/ErrorState';
import { PageHeader } from '../../components/common/PageHeader';
import { OrderForm } from '../../components/orders/OrderForm';
import { useClients, useOrderDetails } from '../../hooks/useProductionOrders';
import { updateProductionOrder } from '../../services/productionOrdersService';
import { formValuesToInput, orderToFormValues, type OrderFormValues } from '../../utils/orderForm';

export default function EditOrderPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, error, reload } = useOrderDetails(id);
  const { data: clients = [] } = useClients();
  const initialValues = useMemo(() => (data ? orderToFormValues(data.order) : null), [data]);

  const backLink = (
    <Link component={RouterLink} to={`/production/orders/${id}`} underline="hover" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8125rem' }}>
      <ArrowLeft size={14} aria-hidden /> Back to order
    </Link>
  );

  const handleSubmit = async (values: OrderFormValues) => {
    const order = await updateProductionOrder(id, formValuesToInput(values));
    navigate(`/production/orders/${order.id}`, { state: { flash: `${order.poNumber} saved.` } });
  };

  if (error && !data) {
    return (
      <Paper>
        <ErrorState title="Order could not be loaded" message="Try again, or go back to the orders list." onRetry={reload} />
      </Paper>
    );
  }

  return (
    <>
      <PageHeader title={data ? `Edit ${data.order.poNumber}` : 'Edit order'} subtitle="Status and progress are changed from the order page." leading={backLink} />
      {initialValues ? (
        <OrderForm
          initialValues={initialValues}
          clients={clients}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/production/orders/${id}`)}
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
