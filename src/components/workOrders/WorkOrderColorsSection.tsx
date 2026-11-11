import { Fragment } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Trash2, X } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { tokens } from '../../theme';
import { formatNumber } from '../../utils/format';
import { calculateWorkOrderTotals, fabricColorOf, fabricRequirements, planColor } from '../../utils/workOrderCalc';
import {
  SIZE_PRESETS,
  colorRowToLine,
  fabricRowToSpec,
  newColorRow,
  newSizeRow,
  type ColorRow,
  type FabricRow,
  type FormText,
  type SizeRow,
} from '../../utils/workOrderForm';
import type { FabricKind } from '../../types/workOrder';
import { SectionCard } from '../common/SectionCard';

interface Props {
  text: FormText;
  sizes: SizeRow[];
  colors: ColorRow[];
  fabrics?: FabricRow[];
  poTotal: number;
  errors: Record<string, string>;
  onSizesChange: (sizes: SizeRow[]) => void;
  onColorsChange: (colors: ColorRow[]) => void;
}

const headCellSx = { fontWeight: 600, whiteSpace: 'nowrap' } as const;

export function WorkOrderColorsSection({
  text,
  sizes,
  colors,
  fabrics = [],
  poTotal,
  errors,
  onSizesChange,
  onColorsChange,
}: Props) {
  const { locale } = useI18n();
  const kindLabel: Record<FabricKind, string> = {
    MAIN: text.kindMain,
    RIB: text.kindRib,
    AUXILIARY: text.kindAux,
    OTHER: text.kindOther,
  };
  const specs = fabrics.map(fabricRowToSpec);
  /** Fabrics that need their own color column (rib, auxiliary, other). */
  const extraFabrics = fabrics.filter((fabric) => fabric.kind !== 'MAIN');
  /** Fabrics with a consumption: they get a quantity column in the cutting summary. */
  const consumedFabrics = specs.filter((fabric) => (fabric.consumptionPerPiece ?? 0) > 0);

  const formatDecimal = (val: number) => formatNumber(Math.round(val * 100) / 100);

  // The preview is keyed by size row id, so the ratio stays attached when a size is renamed.
  const sizeIds = sizes.map((size) => size.id);
  const lines = colors.map((row) => colorRowToLine(row, sizeIds));
  const plans = lines.map((line) => planColor(line, sizeIds));
  const totals = calculateWorkOrderTotals({ sizes: sizeIds, colors: lines, pos: [] });
  const requirements = fabricRequirements({ sizes: sizeIds, colors: lines, fabrics: specs });
  const fabricLabel = (fabric: { name: string; kind: FabricKind }) => fabric.name.trim() || kindLabel[fabric.kind];

  const patchColor = (id: string, patch: Partial<ColorRow>) =>
    onColorsChange(colors.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const setRatio = (rowId: string, sizeId: string, value: string) =>
    onColorsChange(
      colors.map((row) => (row.id === rowId ? { ...row, ratio: { ...row.ratio, [sizeId]: value } } : row)),
    );

  const columnCount = sizes.length + 6 + extraFabrics.length;
  const mismatch = poTotal !== totals.orderedPieces;

  return (
    <>
      <SectionCard title={text.secSizes} description={text.secSizesDesc}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {text.presets}
          </Typography>
          {SIZE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => onSizesChange(preset.sizes.map((label) => newSizeRow(label)))}
            >
              {preset.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          {sizes.map((size, index) => (
            <TextField
              key={size.id}
              size="small"
              label={`${text.size} ${index + 1}`}
              value={size.label}
              onChange={(event) =>
                onSizesChange(sizes.map((row) => (row.id === size.id ? { ...row, label: event.target.value } : row)))
              }
              sx={{ width: 120 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={sizes.length === 1 ? text.keepOne : text.remove}>
                      <span>
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label={text.remove}
                          disabled={sizes.length === 1}
                          onClick={() => onSizesChange(sizes.filter((row) => row.id !== size.id))}
                        >
                          <X size={14} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          ))}
          <Button startIcon={<Plus size={16} />} onClick={() => onSizesChange([...sizes, newSizeRow()])}>
            {text.addSize}
          </Button>
        </Box>
        {errors.sizes && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            {errors.sizes}
          </Typography>
        )}
      </SectionCard>

      <SectionCard title={text.secColors} description={text.secColorsDesc} flush>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>{text.color}</TableCell>
                {extraFabrics.map((fabric) => (
                  <TableCell key={fabric.id} sx={headCellSx}>
                    {text.fabricColorOf(kindLabel[fabric.kind])}
                  </TableCell>
                ))}
                {sizes.map((size) => (
                  <TableCell key={size.id} align="center" sx={headCellSx}>
                    {size.label.trim() || '—'}
                  </TableCell>
                ))}
                <TableCell align="center" sx={headCellSx}>
                  <Tooltip title={text.bagTip}>
                    <span>{text.bag}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={headCellSx}>{text.quantity}</TableCell>
                <TableCell sx={headCellSx}>{text.extra}</TableCell>
                <TableCell align="right" sx={headCellSx}>
                  {text.toCut}
                </TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {colors.map((row, index) => {
                const plan = plans[index];
                const messages = [
                  errors[`colors.${row.id}.name`],
                  errors[`colors.${row.id}.ratio`],
                  errors[`colors.${row.id}.orderQuantity`],
                  errors[`colors.${row.id}.extraPercent`],
                ].filter(Boolean);
                return (
                  <Fragment key={row.id}>
                    <TableRow sx={messages.length ? { '& td': { borderBottom: 0 } } : undefined}>
                      <TableCell>
                        <TextField
                          size="small"
                          value={row.name}
                          onChange={(event) => patchColor(row.id, { name: event.target.value })}
                          error={Boolean(errors[`colors.${row.id}.name`])}
                          inputProps={{ 'aria-label': text.color }}
                          sx={{ minWidth: 140 }}
                        />
                      </TableCell>
                      {extraFabrics.map((fabric) => (
                        <TableCell key={fabric.id} sx={{ px: 0.5 }}>
                          <TextField
                            size="small"
                            placeholder={text.sameColor}
                            value={row.fabricColors[fabric.id] ?? ''}
                            onChange={(event) =>
                              patchColor(row.id, { fabricColors: { ...row.fabricColors, [fabric.id]: event.target.value } })
                            }
                            inputProps={{ 'aria-label': text.fabricColorOf(kindLabel[fabric.kind]) }}
                            sx={{ minWidth: 120 }}
                          />
                        </TableCell>
                      ))}
                      {sizes.map((size) => (
                        <TableCell key={size.id} align="center" sx={{ px: 0.5 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={row.ratio[size.id] ?? ''}
                            onChange={(event) => setRatio(row.id, size.id, event.target.value)}
                            error={Boolean(errors[`colors.${row.id}.ratio`])}
                            inputProps={{ min: 0, step: 1, style: { textAlign: 'center' }, 'aria-label': size.label }}
                            sx={{ width: 68 }}
                          />
                          {plan.bagSize > 0 && Number(row.orderQuantity) > 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                fontWeight: 600,
                                mt: 0.25,
                              }}
                            >
                              {formatNumber(plan.orderPerSize[size.id] ?? 0)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 700, color: tokens.ink }}>
                        {plan.bagSize || '—'}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.orderQuantity}
                          onChange={(event) => patchColor(row.id, { orderQuantity: event.target.value })}
                          error={Boolean(errors[`colors.${row.id}.orderQuantity`])}
                          inputProps={{ min: 0, step: 1, 'aria-label': text.quantity }}
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.extraPercent}
                          placeholder="0"
                          onChange={(event) => patchColor(row.id, { extraPercent: event.target.value })}
                          error={Boolean(errors[`colors.${row.id}.extraPercent`])}
                          inputProps={{ min: 0, max: 100, step: 'any', 'aria-label': text.extra }}
                          sx={{ width: 84 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Typography component="span" sx={{ fontWeight: 600 }}>
                          {formatNumber(plan.cutPieces)}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatNumber(plan.cutBags)} {text.bags}
                        </Typography>
                      </TableCell>
                      <TableCell padding="checkbox">
                        <Tooltip title={colors.length === 1 ? text.keepOne : text.remove}>
                          <span>
                            <IconButton
                              aria-label={text.remove}
                              disabled={colors.length === 1}
                              onClick={() => onColorsChange(colors.filter((candidate) => candidate.id !== row.id))}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    {messages.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={columnCount} sx={{ pt: 0 }}>
                          <Typography variant="caption" color="error">
                            {messages.join(' · ')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ p: 2 }}>
          <Button startIcon={<Plus size={16} />} onClick={() => onColorsChange([...colors, newColorRow()])}>
            {text.addColor}
          </Button>
          {errors.colors && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              {errors.colors}
            </Typography>
          )}
        </Box>
      </SectionCard>

      <SectionCard title={text.secSummary} description={text.secCuttingDesc} flush>
        {consumedFabrics.length === 0 && (
          <Alert severity="info" variant="outlined" sx={{ m: 2, mb: 1 }}>
            {locale === 'ar'
              ? 'يرجى إدخال استهلاك القطعة في قسم الخامات أعلاه ليتم ضربه في عدد القطع وحساب كميات القص تلقائيًا.'
              : 'Please enter consumption per piece in the Fabrics section above to calculate cutting quantities automatically.'}
          </Alert>
        )}

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>{text.color}</TableCell>
                {sizes.map((size) => (
                  <TableCell key={size.id} align="center" sx={headCellSx}>
                    {size.label.trim() || '—'}
                  </TableCell>
                ))}
                <TableCell align="right" sx={headCellSx}>
                  {locale === 'ar' ? 'إجمالي القص (قطعة)' : 'Cut Total (pcs)'}
                </TableCell>
                {consumedFabrics.map((fabric) => (
                  <TableCell key={fabric.id} align="right" sx={headCellSx}>
                    {fabricLabel(fabric)} ({fabric.consumptionUnit})
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {colors.map((row, index) => {
                const plan = plans[index];
                return (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name.trim() || '—'}</TableCell>
                    {sizes.map((size) => (
                      <TableCell key={size.id} align="center" sx={{ fontWeight: 600, color: tokens.textPrimary }}>
                        {formatNumber(plan.cutPerSize[size.id] ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                      {formatNumber(plan.cutPieces)}
                    </TableCell>
                    {consumedFabrics.map((fabric) => {
                      const own = (row.fabricColors[fabric.id] ?? '').trim();
                      const differs =
                        fabric.kind !== 'MAIN' && own !== '' && own.toLowerCase() !== row.name.trim().toLowerCase();
                      return (
                        <TableCell key={fabric.id} align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.textPrimary }}>
                            {formatDecimal(plan.cutPieces * (fabric.consumptionPerPiece ?? 0))}
                          </Typography>
                          {fabric.kind !== 'MAIN' && (
                            <Chip
                              size="small"
                              variant={differs ? 'filled' : 'outlined'}
                              color={differs ? 'secondary' : 'default'}
                              label={fabricColorOf(row, fabric)}
                              sx={{ mt: 0.25, height: 20, fontSize: '0.6875rem' }}
                            />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              <TableRow
                sx={{
                  '& td': {
                    fontWeight: 700,
                    borderTop: `2px dashed ${tokens.stitch}66`,
                    bgcolor: 'rgba(27, 42, 65, 0.02)',
                  },
                }}
              >
                <TableCell>{text.total}</TableCell>
                {sizes.map((size) => (
                  <TableCell key={size.id} align="center">
                    {formatNumber(totals.cutPerSize[size.id] ?? 0)}
                  </TableCell>
                ))}
                <TableCell align="right">{formatNumber(totals.cutPieces)}</TableCell>
                {consumedFabrics.map((fabric) => (
                  <TableCell key={fabric.id} align="right">
                    {formatDecimal(totals.cutPieces * (fabric.consumptionPerPiece ?? 0))}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ p: 2 }}>
          {mismatch ? (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ mb: 2, bgcolor: 'rgba(194, 51, 31, 0.04)', borderColor: 'error.light' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {text.errPoMismatch(poTotal, totals.orderedPieces)}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'error.main' }}>
                {locale === 'ar'
                  ? `الفرق: ${Math.abs(poTotal - totals.orderedPieces)} قطعة (${totals.orderedPieces > poTotal ? 'زيادة في كميات الألوان عن الـ PO' : 'عجز في كميات الألوان عن الـ PO'}). يجب أن يتطابق إجمالي الألوان مع إجمالي الـ PO.`
                  : `Difference: ${Math.abs(poTotal - totals.orderedPieces)} pieces (${totals.orderedPieces > poTotal ? 'colors exceed PO' : 'colors less than PO'}). Total colors must equal total PO.`}
              </Typography>
            </Alert>
          ) : poTotal > 0 ? (
            <Alert severity="success" variant="outlined" sx={{ mb: 2, bgcolor: 'rgba(21, 122, 60, 0.04)' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {locale === 'ar'
                  ? `مجموع كميات الألوان (${formatNumber(totals.orderedPieces)}) يطابق إجمالي كميات الـ PO (${formatNumber(poTotal)}) تمامًا.`
                  : `Total colors quantity (${formatNumber(totals.orderedPieces)}) matches PO total (${formatNumber(poTotal)}) perfectly.`}
              </Typography>
            </Alert>
          ) : null}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <Typography variant="body2" color="primary.main">
              {locale === 'ar' ? 'إجمالي مطلوب القص' : text.cutTotal}:{' '}
              <Box component="strong" sx={{ fontSize: '0.9375rem' }}>
                {formatNumber(totals.cutPieces)} {locale === 'ar' ? 'قطعة' : 'pcs'}
              </Box>
            </Typography>
            {consumedFabrics.map((fabric) => (
              <Typography key={fabric.id} variant="body2" color="text.primary">
                {text.requiredFabric} — {fabricLabel(fabric)}:{' '}
                <Box component="strong" sx={{ fontSize: '0.9375rem' }}>
                  {formatDecimal(totals.cutPieces * (fabric.consumptionPerPiece ?? 0))} {fabric.consumptionUnit}
                </Box>
              </Typography>
            ))}
          </Box>
        </Box>
      </SectionCard>

      {requirements.length > 0 && (
        <SectionCard title={text.secFabricByColor} flush>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellSx}>{text.fabricCol}</TableCell>
                  <TableCell sx={headCellSx}>{text.fabricColorCol}</TableCell>
                  <TableCell align="right" sx={headCellSx}>
                    {text.quantityCol}
                  </TableCell>
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
          </Box>
        </SectionCard>
      )}
    </>
  );
}
