import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { SIZE_CODES } from '../../config/orderOptions';
import type { ProductionOrder } from '../../types/production';
import { formatDate, formatFabric, formatNumber } from '../../utils/format';
import { ColorSwatch } from '../common/ColorSwatch';
import { OrderActions } from './OrderActions';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ProductionProgress } from './ProductionProgress';

interface OrderTableProps {
  orders: readonly ProductionOrder[];
  loading?: boolean;
  onChangeStatus: (order: ProductionOrder) => void;
}

const COLUMNS = [
  'PO',
  'Client',
  'Order Details',
  'Size',
  'Color',
  'Fabric Quantity',
  'Pieces',
  'Status',
  'Progress',
  'Actions',
] as const;

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function sizeLabel(order: ProductionOrder): string {
  const sizes = SIZE_CODES.filter((size) => (order.sizeBreakdown[size] ?? 0) > 0);
  return sizes.length > 0 ? sizes.join(' / ') : '—';
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }, (_, row) => (
        <TableRow key={row}>
          {COLUMNS.map((column) => (
            <TableCell key={column}>
              <Skeleton width={column === 'Order Details' ? 120 : 70} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function OrderTable({ orders, loading, onChangeStatus }: OrderTableProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  // Jump back to the first page when filters change the result set.
  useEffect(() => setPage(0), [orders.length]);

  const visible = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader sx={{ minWidth: 1180 }} aria-label="Production orders">
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column}
                  align={column === 'Fabric Quantity' || column === 'Pieces' ? 'right' : 'left'}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : (
              visible.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  onClick={() => navigate(`/production/orders/${order.id}`)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{order.poNumber}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.client}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {order.product}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due {formatDate(order.expectedDeliveryDate)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{sizeLabel(order)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {order.colors.map((color) => (
                        <Box key={color} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                          <ColorSwatch color={color} />
                          {color}
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatFabric(order.fabricQuantity, order.fabricUnit)}
                  </TableCell>
                  <TableCell align="right">{formatNumber(order.totalPieces)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <ProductionProgress value={order.progress} status={order.status} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={(event) => event.stopPropagation()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Button size="small" onClick={() => navigate(`/production/orders/${order.id}`)}>
                        View
                      </Button>
                      <OrderActions order={order} onChangeStatus={onChangeStatus} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && (
        <TablePagination
          component="div"
          count={orders.length}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          labelRowsPerPage="Rows"
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      )}
    </Paper>
  );
}
