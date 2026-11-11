import { Alert, Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { FileDown, Pencil } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { SectionCard } from '../common/SectionCard';
import { tokens } from '../../theme';
import type { AccessoryLine, WorkOrder } from '../../types/workOrder';
import { formatDate, formatNumber } from '../../utils/format';
import { printWorkOrder } from '../../utils/printWorkOrder';
import {
  calculateAccessory,
  calculateWorkOrderTotals,
  fabricRequirements,
  planColor,
} from '../../utils/workOrderCalc';
import type { FormText } from '../../utils/workOrderForm';

export function WorkOrderSavedSummary({
  order,
  text,
  locale,
  title,
  successMessage,
  onNew,
  onBack,
  onEdit,
}: {
  order: WorkOrder;
  text: FormText;
  locale: 'ar' | 'en';
  title: string;
  successMessage: string;
  onNew: () => void;
  onBack: () => void;
  onEdit: () => void;
}) {
  const plans = order.colors.map((color) => planColor(color, order.sizes));
  const totals = calculateWorkOrderTotals(order);
  const consumed = (order.fabrics ?? []).filter((fabric) => (fabric.consumptionPerPiece ?? 0) > 0);
  const requirements = fabricRequirements(order);
  const accessories: AccessoryLine[] = order.accessories ?? [];
  const measurements = order.measurements ?? [];
  const kindLabel = { MAIN: text.kindMain, RIB: text.kindRib, AUXILIARY: text.kindAux, OTHER: text.kindOther };
  const sourceLabel = { LOCAL: text.srcLocal, IMPORTED: text.srcImported, NOMINATED: text.srcNominated };
  const money = (value: number) => formatNumber(Math.round(value * 100) / 100);

  return (
    <>
      <PageHeader
        title={`${title} ${order.workOrderNumber}`}
        subtitle={`${order.client} · ${order.modelName} · ${order.clientStyle} / ${order.ourStyle}`}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FileDown size={18} />}
              onClick={() => printWorkOrder(order, locale)}
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
            <Button color="inherit" startIcon={<Pencil size={16} />} onClick={onEdit}>
              {text.edit}
            </Button>
            <Button color="inherit" onClick={onBack}>
              {text.backToList}
            </Button>
            <Button variant="contained" onClick={onNew}>
              {text.newOrder}
            </Button>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Alert severity="success">{successMessage}</Alert>

        {order.imageUrl && (
          <SectionCard title={text.modelImage}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                backgroundColor: '#FAFAFA',
                borderRadius: 1,
              }}
            >
              <Box
                component="img"
                src={order.imageUrl}
                alt={order.modelName || text.modelImage}
                sx={{
                  maxHeight: 260,
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            </Box>
          </SectionCard>
        )}

        <SectionCard title={text.secPos} flush>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{text.poNumber}</TableCell>
                <TableCell align="right">{text.poQty}</TableCell>
                <TableCell>{text.poDelivery}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.pos.map((po) => (
                <TableRow key={po.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{po.poNumber}</TableCell>
                  <TableCell align="right">{formatNumber(po.quantity)}</TableCell>
                  <TableCell>{formatDate(po.deliveryDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title={text.secSummary} flush>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{text.color}</TableCell>
                  {order.sizes.map((size) => (
                    <TableCell key={size} align="center">
                      {size}
                    </TableCell>
                  ))}
                  <TableCell align="right">{locale === 'ar' ? 'إجمالي القص (قطعة)' : 'Cut Total (pcs)'}</TableCell>
                  {consumed.map((fabric) => (
                    <TableCell key={fabric.id} align="right">
                      {fabric.name || kindLabel[fabric.kind]} ({fabric.consumptionUnit})
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {order.colors.map((color, index) => (
                  <TableRow key={color.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{color.name}</TableCell>
                    {order.sizes.map((size) => (
                      <TableCell key={size} align="center" sx={{ fontWeight: 600 }}>
                        {formatNumber(plans[index].cutPerSize[size] ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatNumber(plans[index].cutPieces)}
                    </TableCell>
                    {consumed.map((fabric) => (
                      <TableCell key={fabric.id} align="right" sx={{ fontWeight: 700 }}>
                        {money(plans[index].cutPieces * (fabric.consumptionPerPiece ?? 0))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                  <TableCell>{text.total}</TableCell>
                  {order.sizes.map((size) => (
                    <TableCell key={size} align="center">
                      {formatNumber(totals.cutPerSize[size] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell align="right">{formatNumber(totals.cutPieces)}</TableCell>
                  {consumed.map((fabric) => (
                    <TableCell key={fabric.id} align="right">
                      {money(totals.cutPieces * (fabric.consumptionPerPiece ?? 0))}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>
          <Paper variant="outlined" sx={{ m: 2, p: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap', border: 0 }}>
            <Typography variant="body2" color="primary.main">
              {locale === 'ar' ? 'إجمالي مطلوب القص' : text.cutTotal}:{' '}
              <strong>
                {formatNumber(totals.cutPieces)} {locale === 'ar' ? 'قطعة' : 'pcs'}
              </strong>
            </Typography>
          </Paper>
        </SectionCard>

        {requirements.length > 0 && (
          <SectionCard title={text.secFabricByColor} flush>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{text.fabricCol}</TableCell>
                  <TableCell>{text.fabricColorCol}</TableCell>
                  <TableCell align="right">{text.quantityCol}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requirements.map((item) => (
                  <TableRow key={`${item.fabric.id}|${item.color.toLowerCase()}`}>
                    <TableCell>
                      {kindLabel[item.fabric.kind]} — {item.fabric.name}
                    </TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatNumber(item.quantity)} {item.fabric.consumptionUnit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        {measurements.length > 0 && (
          <SectionCard title={text.secMeasures} flush>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>{text.measureName}</TableCell>
                    <TableCell>{text.measureFrom}</TableCell>
                    <TableCell>{text.measureTo}</TableCell>
                    {order.sizes.map((size) => (
                      <TableCell key={size} align="center">
                        {size}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {measurements.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.measureFrom}</TableCell>
                      <TableCell>{row.measureTo}</TableCell>
                      {order.sizes.map((size) => (
                        <TableCell key={size} align="center">
                          {row.values[size] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </SectionCard>
        )}

        {accessories.length > 0 && (
          <SectionCard title={text.secAccOperation + ' / ' + text.secAccPacking} flush>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>{text.accessory}</TableCell>
                    <TableCell>{text.accSpec}</TableCell>
                    <TableCell>{text.accSource}</TableCell>
                    <TableCell align="center">{text.accQty} : {text.accPer}</TableCell>
                    <TableCell align="right">{text.accTotal}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accessories.map((row) => {
                    const result = calculateAccessory(row, totals, order.sizes);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.section === 'PACKING' ? text.secAccPacking : text.secAccOperation}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell>
                          {row.spec}
                          {row.bySize && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {order.sizes
                                .map(
                                  (size) =>
                                    `${size}${row.specsBySize[size] ? ` (${row.specsBySize[size]})` : ''}: ${formatNumber(
                                      result.perSize[size] ?? 0,
                                    )}`,
                                )
                                .join(' | ')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{sourceLabel[row.source]}</TableCell>
                        <TableCell align="center">
                          {row.accessoryQty} : {row.garmentQty}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatNumber(result.total)} {row.unit}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </SectionCard>
        )}
      </Box>
    </>
  );
}
