import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import {
  measurementCode,
  newMeasureRow,
  type FormText,
  type MeasureRow,
  type SizeRow,
} from '../../utils/workOrderForm';
import { SectionCard } from '../common/SectionCard';

interface Props {
  text: FormText;
  sizes: SizeRow[];
  measurements: MeasureRow[];
  onChange: (measurements: MeasureRow[]) => void;
}

const headCellSx = { fontWeight: 600, whiteSpace: 'nowrap' } as const;

/** Optional measurement chart: each dimension, how it is measured (from / to) and a value per size. */
export function WorkOrderMeasurementsSection({ text, sizes, measurements, onChange }: Props) {
  const patch = (id: string, change: Partial<MeasureRow>) =>
    onChange(measurements.map((row) => (row.id === id ? { ...row, ...change } : row)));
  const setValue = (row: MeasureRow, sizeId: string, value: string) =>
    patch(row.id, { values: { ...row.values, [sizeId]: value } });

  return (
    <SectionCard title={text.secMeasures} description={text.secMeasuresDesc} flush>
      {measurements.length > 0 && (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} />
                <TableCell sx={headCellSx}>{text.measureName}</TableCell>
                <TableCell sx={headCellSx}>{text.measureFrom}</TableCell>
                <TableCell sx={headCellSx}>{text.measureTo}</TableCell>
                {sizes.map((size) => (
                  <TableCell key={size.id} align="center" sx={headCellSx}>
                    {size.label.trim() || '—'}
                  </TableCell>
                ))}
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {measurements.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{measurementCode(index)}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.name}
                      onChange={(event) => patch(row.id, { name: event.target.value })}
                      inputProps={{ 'aria-label': text.measureName }}
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.from}
                      onChange={(event) => patch(row.id, { from: event.target.value })}
                      inputProps={{ 'aria-label': text.measureFrom }}
                      sx={{ minWidth: 110 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.to}
                      onChange={(event) => patch(row.id, { to: event.target.value })}
                      inputProps={{ 'aria-label': text.measureTo }}
                      sx={{ minWidth: 110 }}
                    />
                  </TableCell>
                  {sizes.map((size) => (
                    <TableCell key={size.id} align="center" sx={{ px: 0.5 }}>
                      <TextField
                        size="small"
                        value={row.values[size.id] ?? ''}
                        onChange={(event) => setValue(row, size.id, event.target.value)}
                        inputProps={{ style: { textAlign: 'center' }, 'aria-label': size.label }}
                        sx={{ width: 72 }}
                      />
                    </TableCell>
                  ))}
                  <TableCell padding="checkbox">
                    <Tooltip title={text.remove}>
                      <IconButton
                        aria-label={text.remove}
                        onClick={() => onChange(measurements.filter((candidate) => candidate.id !== row.id))}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      <Box sx={{ p: 2 }}>
        <Button startIcon={<Plus size={16} />} onClick={() => onChange([...measurements, newMeasureRow()])}>
          {text.addMeasure}
        </Button>
      </Box>
    </SectionCard>
  );
}
