import { useState, type FormEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import { FABRIC_UNITS, SIZE_CODES } from '../../config/orderOptions';
import { DuplicatePoNumberError } from '../../services/errors';
import { tokens } from '../../theme';
import type { FabricUnit } from '../../types/production';
import { formatNumber } from '../../utils/format';
import {
  calculateTotals,
  hasErrors,
  newColorRow,
  validateOrderForm,
  type OrderFormErrors,
  type OrderFormValues,
} from '../../utils/orderForm';
import { SectionCard } from '../common/SectionCard';

interface OrderFormProps {
  initialValues: OrderFormValues;
  clients: readonly string[];
  submitLabel: string;
  onSubmit: (values: OrderFormValues) => Promise<void>;
  onCancel: () => void;
}

export function OrderForm({ initialValues, clients, submitLabel, onSubmit, onCancel }: OrderFormProps) {
  const [values, setValues] = useState<OrderFormValues>(initialValues);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totals = calculateTotals(values);

  /** Applies a change and, once the user has tried to submit, re-validates live. */
  const update = (next: OrderFormValues) => {
    setValues(next);
    if (submitted) setErrors(validateOrderForm(next));
  };

  const setField = <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) =>
    update({ ...values, [key]: value });

  const setColorRow = (id: string, patch: Partial<{ color: string; fabricQuantity: string }>) =>
    update({ ...values, colors: values.colors.map((row) => (row.id === id ? { ...row, ...patch } : row)) });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validateOrderForm(values);
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (reason: unknown) {
      if (reason instanceof DuplicatePoNumberError) setErrors({ poNumber: reason.message });
      else setSubmitError(reason instanceof Error ? reason.message : 'The order could not be saved.');
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      {submitted && hasErrors(errors) && (
        <Alert severity="warning">Fix the highlighted fields before saving.</Alert>
      )}

      <SectionCard title="Order information">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          <Autocomplete
            freeSolo
            options={[...clients]}
            inputValue={values.client}
            onInputChange={(_, input) => setField('client', input)}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Client"
                error={Boolean(errors.client)}
                helperText={errors.client ?? 'Pick an existing client or type a new one.'}
              />
            )}
          />
          <TextField
            required
            label="PO Number"
            placeholder="PO-2026-013"
            value={values.poNumber}
            onChange={(event) => setField('poNumber', event.target.value)}
            error={Boolean(errors.poNumber)}
            helperText={errors.poNumber}
          />
          <TextField
            required
            type="date"
            label="Order Date"
            value={values.orderDate}
            onChange={(event) => setField('orderDate', event.target.value)}
            error={Boolean(errors.orderDate)}
            helperText={errors.orderDate}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            required
            type="date"
            label="Expected Delivery Date"
            value={values.expectedDeliveryDate}
            onChange={(event) => setField('expectedDeliveryDate', event.target.value)}
            error={Boolean(errors.expectedDeliveryDate)}
            helperText={errors.expectedDeliveryDate}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            required
            label="Product / Order Details"
            placeholder="Basic T-Shirt"
            value={values.product}
            onChange={(event) => setField('product', event.target.value)}
            error={Boolean(errors.product)}
            helperText={errors.product}
            sx={{ gridColumn: { md: '1 / -1' } }}
          />
        </Box>
      </SectionCard>

      <SectionCard
        title="Fabric and color"
        description="Add one row per color. Total fabric is the sum of all rows."
        action={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="fabric-unit-label">Unit</InputLabel>
            <Select
              labelId="fabric-unit-label"
              label="Unit"
              value={values.fabricUnit}
              onChange={(event) => setField('fabricUnit', event.target.value as FabricUnit)}
            >
              {FABRIC_UNITS.map((unit) => (
                <MenuItem key={unit.value} value={unit.value}>
                  {unit.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {values.colors.map((row, index) => {
            const rowErrors = errors.colors?.[row.id];
            return (
              <Box key={row.id} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 40px', alignItems: 'start' }}>
                <TextField
                  required
                  label={`Color ${values.colors.length > 1 ? index + 1 : ''}`.trim()}
                  value={row.color}
                  onChange={(event) => setColorRow(row.id, { color: event.target.value })}
                  error={Boolean(rowErrors?.color)}
                  helperText={rowErrors?.color}
                />
                <TextField
                  required
                  type="number"
                  label={`Fabric Quantity (${values.fabricUnit})`}
                  value={row.fabricQuantity}
                  onChange={(event) => setColorRow(row.id, { fabricQuantity: event.target.value })}
                  error={Boolean(rowErrors?.fabricQuantity)}
                  helperText={rowErrors?.fabricQuantity}
                  inputProps={{ min: 0, step: 'any' }}
                />
                <Tooltip title={values.colors.length === 1 ? 'At least one color is required' : 'Remove color'}>
                  <span>
                    <IconButton
                      aria-label="Remove color"
                      disabled={values.colors.length === 1}
                      onClick={() => update({ ...values, colors: values.colors.filter((candidate) => candidate.id !== row.id) })}
                      sx={{ mt: 0.5 }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          })}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Button
              startIcon={<Plus size={16} />}
              onClick={() => update({ ...values, colors: [...values.colors, newColorRow()] })}
            >
              Add color
            </Button>
            <Typography variant="body2" color="text.secondary">
              Total fabric:{' '}
              <Box component="strong" sx={{ color: 'text.primary' }}>
                {formatNumber(totals.fabric)} {values.fabricUnit}
              </Box>
            </Typography>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard title="Size quantities" description="Leave a size blank if it is not part of this order.">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' } }}>
          {SIZE_CODES.map((size) => (
            <TextField
              key={size}
              type="number"
              label={size}
              value={values.sizes[size]}
              onChange={(event) => update({ ...values, sizes: { ...values.sizes, [size]: event.target.value } })}
              error={Boolean(errors.sizes?.[size])}
              helperText={errors.sizes?.[size]}
              inputProps={{ min: 0, step: 1 }}
            />
          ))}
        </Box>
        <Box
          sx={{
            mt: 2.5,
            pt: 2,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            borderTop: `2px dashed ${tokens.stitch}66`,
          }}
        >
          <Typography variant="subtitle2">Total Pieces</Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 600 }} aria-live="polite">
            {formatNumber(totals.pieces)}
          </Typography>
        </Box>
        {errors.piecesTotal && (
          <Typography variant="caption" color="error">
            {errors.piecesTotal}
          </Typography>
        )}
      </SectionCard>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button color="inherit" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
