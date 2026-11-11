import { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { OrderForm } from '../../components/orders/OrderForm';
import { useClients } from '../../hooks/useProductionOrders';
import { createProductionOrder } from '../../services/productionOrdersService';
import { todayIso } from '../../utils/format';
import { emptyOrderFormValues, formValuesToInput, type OrderFormValues } from '../../utils/orderForm';

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const initialValues = useMemo(() => emptyOrderFormValues(todayIso()), []);

  const handleSubmit = async (values: OrderFormValues) => {
    const order = await createProductionOrder(formValuesToInput(values));
    navigate(`/production/orders/${order.id}`, { state: { flash: `${order.poNumber} created.` } });
  };

  return (
    <>
      <PageHeader
        title="New Order"
        subtitle="Enter the client purchase order. It starts in Pending."
        leading={
          <Link component={RouterLink} to="/production/orders" underline="hover" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8125rem' }}>
            <ArrowLeft size={14} aria-hidden /> Production Orders
          </Link>
        }
      />
      <OrderForm
        initialValues={initialValues}
        clients={clients}
        submitLabel="Create order"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/production/orders')}
      />
    </>
  );
}
