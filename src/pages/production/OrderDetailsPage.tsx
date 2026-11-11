import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Link,
  Paper,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ArrowLeft, Pencil, RefreshCw } from 'lucide-react';
import { ColorSwatch } from '../../components/common/ColorSwatch';
import { DetailField } from '../../components/common/DetailField';
import { ErrorState } from '../../components/common/ErrorState';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { ChangeStatusDialog } from '../../components/orders/ChangeStatusDialog';
import { OrderStatusBadge } from '../../components/orders/OrderStatusBadge';
import { ProductionProgress } from '../../components/orders/ProductionProgress';
import { ProductionTimeline } from '../../components/orders/ProductionTimeline';
import { WorkflowDiagram } from '../../components/orders/WorkflowDiagram';
import { SIZE_CODES } from '../../config/orderOptions';
import { statusConfig } from '../../config/statusConfig';
import { useOrderDetails } from '../../hooks/useProductionOrders';
import { OrderNotFoundError } from '../../services/errors';
import { changeOrderStatus } from '../../services/productionOrdersService';
import type { ProductionOrder, ProductionStatus } from '../../types/production';
import { formatDate, formatFabric, formatNumber } from '../../utils/format';
import { getAllowedTransitions } from '../../utils/workflow';

function DetailsSkeleton() {
  return (
    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' } }}>
      {[220, 200, 260, 160].map((height, index) => (
        <Skeleton key={index} variant="rounded" height={height} />
      ))}
    </Box>
  );
}

export default function OrderDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, error, loading, reload } = useOrderDetails(id);
  const [statusTarget, setStatusTarget] = useState<ProductionOrder | null>(null);
  const [toast, setToast] = useState<string | null>((location.state as { flash?: string } | null)?.flash ?? null);

  const order = data?.order;

  // Support deep links like /production/orders/3#history once the content has rendered.
  useEffect(() => {
    if (!order || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [order, location.hash]);

  const backLink = (
    <Link
      component={RouterLink}
      to="/production/orders"
      underline="hover"
      color="text.secondary"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8125rem' }}
    >
      <ArrowLeft size={14} aria-hidden /> Production Orders
    </Link>
  );

  if (error && !order) {
    const notFound = error instanceof OrderNotFoundError;
    return (
      <>
        <Box sx={{ mb: 2 }}>{backLink}</Box>
        <Paper>
          <ErrorState
            title={notFound ? 'Order not found' : undefined}
            message={notFound ? 'This order does not exist or was removed.' : 'The order could not be loaded. Try again.'}
            onRetry={notFound ? () => navigate('/production/orders') : reload}
          />
        </Paper>
      </>
    );
  }

  if (!order || !data) {
    return (
      <>
        <PageHeader title="Loading order…" leading={backLink} />
        {loading && <DetailsSkeleton />}
      </>
    );
  }

  const handleStatusConfirm = async (target: ProductionOrder, status: ProductionStatus, note: string) => {
    await changeOrderStatus(target.id, status, note);
    setToast(`Status changed to ${statusConfig[status].label}.`);
    reload();
  };

  const canChangeStatus = getAllowedTransitions(order.status).length > 0;
  const multiColor = order.colors.length > 1;

  return (
    <>
      <PageHeader
        leading={backLink}
        title={order.poNumber}
        subtitle={order.client}
        titleAdornment={<OrderStatusBadge status={order.status} size="medium" />}
        actions={
          <>
            <Button variant="outlined" startIcon={<Pencil size={16} />} onClick={() => navigate(`/production/orders/${order.id}/edit`)}>
              Edit Order
            </Button>
            <Button variant="contained" startIcon={<RefreshCw size={16} />} disabled={!canChangeStatus} onClick={() => setStatusTarget(order)}>
              Change Status
            </Button>
          </>
        }
      />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          <SectionCard title="Order information">
            <Box
              component="dl"
              sx={{ m: 0, display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' } }}
            >
              <DetailField label="Client">{order.client}</DetailField>
              <DetailField label="PO Number">{order.poNumber}</DetailField>
              <DetailField label="Product">{order.product}</DetailField>
              <DetailField label="Order Date">{formatDate(order.orderDate)}</DetailField>
              <DetailField label="Expected Delivery Date">{formatDate(order.expectedDeliveryDate)}</DetailField>
              <DetailField label="Color">{order.colors.join(', ')}</DetailField>
              <DetailField label="Fabric Quantity">{formatFabric(order.fabricQuantity, order.fabricUnit)}</DetailField>
              <DetailField label="Total Pieces">{formatNumber(order.totalPieces)}</DetailField>
              <DetailField label="Progress">
                <ProductionProgress value={order.progress} status={order.status} />
              </DetailField>
            </Box>
          </SectionCard>

          <SectionCard title="Production workflow" description="Where this order is now, and where it goes next.">
            <WorkflowDiagram order={order} />
          </SectionCard>

          <SectionCard id="history" title="Production history" description="Every change recorded for this order.">
            {data.history.length > 0 ? (
              <ProductionTimeline events={data.history} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No history has been recorded yet.
              </Typography>
            )}
          </SectionCard>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          <SectionCard title="Size breakdown" flush>
            <Table size="small" aria-label="Size breakdown">
              <TableHead>
                <TableRow>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SIZE_CODES.filter((size) => (order.sizeBreakdown[size] ?? 0) > 0).map((size) => (
                  <TableRow key={size}>
                    <TableCell>{size}</TableCell>
                    <TableCell align="right">{formatNumber(order.sizeBreakdown[size] ?? 0)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, borderBottom: 0 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, borderBottom: 0 }}>
                    {formatNumber(order.totalPieces)} pieces
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Color information" description={multiColor ? `${order.colors.length} colors in this order` : undefined}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {order.colors.map((color) => (
                <Box
                  key={color}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <ColorSwatch color={color} size={28} />
                  <DetailField label="Color">{color}</DetailField>
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <DetailField label="Fabric">{formatFabric(order.fabricByColor[color] ?? 0, order.fabricUnit)}</DetailField>
                  </Box>
                </Box>
              ))}
              {multiColor && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                  Total fabric: <strong>{formatFabric(order.fabricQuantity, order.fabricUnit)}</strong>
                </Typography>
              )}
            </Box>
          </SectionCard>
        </Box>
      </Box>

      <ChangeStatusDialog order={statusTarget} onClose={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
