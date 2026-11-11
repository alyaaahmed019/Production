import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import type { AccessoryBasis, AccessorySection, AccessorySource, AccessoryUnit } from '../../types/workOrder';
import { formatNumber } from '../../utils/format';
import { calculateAccessory, calculateWorkOrderTotals } from '../../utils/workOrderCalc';
import {
  ACCESSORY_SOURCES,
  ACCESSORY_UNITS,
  colorRowToLine,
  newAccessoryRow,
  toNumber,
  type AccessoryRow,
  type ColorRow,
  type FormText,
  type SizeRow,
} from '../../utils/workOrderForm';
import { SectionCard } from '../common/SectionCard';

interface Props {
  text: FormText;
  section: AccessorySection;
  sizes: SizeRow[];
  colors: ColorRow[];
  /** All accessories of the order (both sections); this card edits only its own section. */
  accessories: AccessoryRow[];
  errors: Record<string, string>;
  onChange: (accessories: AccessoryRow[]) => void;
}

const headCellSx = { fontWeight: 600, whiteSpace: 'nowrap' } as const;

/** Operation or packing accessories. Quantity = garments x (accessories / garments), rounded up. */
export function WorkOrderAccessoriesSection({ text, section, sizes, colors, accessories, errors, onChange }: Props) {
  const sizeIds = sizes.map((size) => size.id);
  const totals = calculateWorkOrderTotals({
    sizes: sizeIds,
    colors: colors.map((row) => colorRowToLine(row, sizeIds)),
    pos: [],
  });

  const mine = accessories.filter((row) => row.section === section);
  const patch = (id: string, change: Partial<AccessoryRow>) =>
    onChange(accessories.map((row) => (row.id === id ? { ...row, ...change } : row)));

  const sourceLabel: Record<AccessorySource, string> = {
    LOCAL: text.srcLocal,
    IMPORTED: text.srcImported,
    NOMINATED: text.srcNominated,
  };

  return (
    <SectionCard
      title={section === 'OPERATION' ? text.secAccOperation : text.secAccPacking}
      description={text.secAccDesc}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mine.map((row) => {
          const result = calculateAccessory(
            {
              accessoryQty: toNumber(row.accessoryQty),
              garmentQty: toNumber(row.garmentQty),
              basis: row.basis,
              bySize: row.bySize,
            },
            totals,
            sizeIds,
          );
          const nameError = errors[`accessories.${row.id}.name`];
          const ratioError = errors[`accessories.${row.id}.ratio`];
          return (
            <Box
              key={row.id}
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr)) 40px' },
                alignItems: 'start',
                p: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <TextField
                required
                label={text.accessory}
                value={row.name}
                onChange={(event) => patch(row.id, { name: event.target.value })}
                error={Boolean(nameError)}
                helperText={nameError}
              />
              <TextField
                label={text.accSpec}
                placeholder={text.accSpecHint}
                value={row.spec}
                onChange={(event) => patch(row.id, { spec: event.target.value })}
              />
              <FormControl>
                <InputLabel id={`acc-unit-${row.id}`}>{text.accUnit}</InputLabel>
                <Select
                  labelId={`acc-unit-${row.id}`}
                  label={text.accUnit}
                  value={row.unit}
                  onChange={(event) => patch(row.id, { unit: event.target.value as AccessoryUnit })}
                >
                  {ACCESSORY_UNITS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel id={`acc-source-${row.id}`}>{text.accSource}</InputLabel>
                <Select
                  labelId={`acc-source-${row.id}`}
                  label={text.accSource}
                  value={row.source}
                  onChange={(event) => patch(row.id, { source: event.target.value as AccessorySource })}
                >
                  {ACCESSORY_SOURCES.map((source) => (
                    <MenuItem key={source} value={source}>
                      {sourceLabel[source]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title={text.remove}>
                <IconButton
                  aria-label={text.remove}
                  onClick={() => onChange(accessories.filter((candidate) => candidate.id !== row.id))}
                  sx={{ mt: 0.5 }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </Tooltip>

              <TextField
                required
                type="number"
                label={text.accQty}
                value={row.accessoryQty}
                onChange={(event) => patch(row.id, { accessoryQty: event.target.value })}
                error={Boolean(ratioError)}
                helperText={ratioError}
                inputProps={{ min: 0, step: 'any' }}
              />
              <TextField
                required
                type="number"
                label={text.accPer}
                value={row.garmentQty}
                onChange={(event) => patch(row.id, { garmentQty: event.target.value })}
                error={Boolean(ratioError)}
                inputProps={{ min: 0, step: 'any' }}
              />
              <FormControl>
                <InputLabel id={`acc-basis-${row.id}`}>{text.accBasis}</InputLabel>
                <Select
                  labelId={`acc-basis-${row.id}`}
                  label={text.accBasis}
                  value={row.basis}
                  onChange={(event) => patch(row.id, { basis: event.target.value as AccessoryBasis })}
                >
                  <MenuItem value="ORDER">{text.basisOrder}</MenuItem>
                  <MenuItem value="CUT">{text.basisCut}</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                label={text.accBySize}
                control={
                  <Checkbox checked={row.bySize} onChange={(event) => patch(row.id, { bySize: event.target.checked })} />
                }
              />
              <span />

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="body2" color="text.secondary">
                  {text.accTotal}:{' '}
                  <Box component="strong" sx={{ color: 'text.primary' }}>
                    {formatNumber(result.total)}
                  </Box>{' '}
                  {row.unit}
                </Typography>
                {row.bySize && (
                  <Box sx={{ overflowX: 'auto', mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headCellSx} />
                          {sizes.map((size) => (
                            <TableCell key={size.id} align="center" sx={headCellSx}>
                              {size.label.trim() || '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={headCellSx}>{text.accSpec}</TableCell>
                          {sizes.map((size) => (
                            <TableCell key={size.id} align="center" sx={{ px: 0.5 }}>
                              <TextField
                                size="small"
                                value={row.specs[size.id] ?? ''}
                                onChange={(event) =>
                                  patch(row.id, { specs: { ...row.specs, [size.id]: event.target.value } })
                                }
                                inputProps={{ style: { textAlign: 'center' }, 'aria-label': size.label }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell sx={headCellSx}>{text.quantityCol}</TableCell>
                          {sizes.map((size) => (
                            <TableCell key={size.id} align="center" sx={{ fontWeight: 600 }}>
                              {formatNumber(result.perSize[size.id] ?? 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
        <Box>
          <Button startIcon={<Plus size={16} />} onClick={() => onChange([...accessories, newAccessoryRow(section)])}>
            {text.addAccessory}
          </Button>
        </Box>
      </Box>
    </SectionCard>
  );
}
