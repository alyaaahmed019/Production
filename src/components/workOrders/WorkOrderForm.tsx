import { useRef, useState, type FormEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import {
  DuplicateWorkOrderNumberError,
  PoInOtherWorkOrderError,
  WorkOrderValidationError,
} from '../../services/errors';
import type { ExternalProcess, FabricKind, FabricUnit, WorkOrderInput } from '../../types/workOrder';
import { formatNumber } from '../../utils/format';
import { validateWorkOrder } from '../../utils/workOrderCalc';
import {
  GARMENT_TYPES,
  formValuesToInput,
  getFormText,
  issuesToMessages,
  newFabricRow,
  newPoRow,
  pruneSizeData,
  toNumber,
  type FabricRow,
  type PoRow,
  type WorkOrderFormValues,
} from '../../utils/workOrderForm';
import { SectionCard } from '../common/SectionCard';
import { ModelImageUpload } from './ModelImageUpload';
import { WorkOrderAccessoriesSection } from './WorkOrderAccessoriesSection';
import { WorkOrderColorsSection } from './WorkOrderColorsSection';
import { WorkOrderMeasurementsSection } from './WorkOrderMeasurementsSection';

interface Props {
  initialValues: WorkOrderFormValues;
  clients: readonly string[];
  onSubmit: (input: WorkOrderInput) => Promise<void>;
  onCancel: () => void;
  onValuesChange?: (values: WorkOrderFormValues) => void;
}

const FABRIC_UNITS: readonly FabricUnit[] = ['kg', 'm', 'yd'];
const KINDS: readonly FabricKind[] = ['MAIN', 'RIB', 'AUXILIARY', 'OTHER'];
const PROCESSES: readonly ExternalProcess[] = ['PRINT', 'EMBROIDERY', 'WASH'];

export function WorkOrderForm({ initialValues, clients, onSubmit, onCancel, onValuesChange }: Props) {
  const { locale } = useI18n();
  const text = getFormText(locale);

  const [values, setValues] = useState<WorkOrderFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const findErrors = (next: WorkOrderFormValues) =>
    issuesToMessages(validateWorkOrder(formValuesToInput(next)), text);

  /** Applies a change; once the user has tried to save, errors are re-checked live. */
  const update = (next: WorkOrderFormValues) => {
    setValues(next);
    onValuesChange?.(next);
    if (submitted) setErrors(findErrors(next));
  };
  const setField = <K extends keyof WorkOrderFormValues>(key: K, value: WorkOrderFormValues[K]) =>
    update({ ...values, [key]: value });

  const patchPo = (id: string, patch: Partial<PoRow>) =>
    update({ ...values, pos: values.pos.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  const patchFabric = (id: string, patch: Partial<FabricRow>) =>
    update({ ...values, fabrics: values.fabrics.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  const toggleProcess = (process: ExternalProcess) =>
    setField(
      'processes',
      values.processes.includes(process)
        ? values.processes.filter((item) => item !== process)
        : [...values.processes, process],
    );

  const poTotal = values.pos.reduce((sum, row) => {
    const quantity = toNumber(row.quantity);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);

  const isDirty = () => JSON.stringify(values) !== JSON.stringify(initialValues);
  const handleCancel = () => {
    if (isDirty() && !window.confirm(text.confirmLeave)) return;
    onCancel();
  };

  const showTop = () =>
    requestAnimationFrame(() => topRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = findErrors(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      showTop();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(formValuesToInput(values));
    } catch (reason: unknown) {
      if (reason instanceof DuplicateWorkOrderNumberError) {
        setErrors({ workOrderNumber: text.errDuplicateWorkOrder(reason.workOrderNumber) });
      } else if (reason instanceof PoInOtherWorkOrderError) {
        const row = values.pos.find((po) => po.poNumber.trim().toUpperCase() === reason.poNumber);
        setErrors(
          row ? { [`pos.${row.id}.poNumber`]: text.errPoInOther(reason.poNumber, reason.workOrderNumber) } : {},
        );
      } else if (reason instanceof WorkOrderValidationError) {
        setErrors(issuesToMessages(reason.issues, text));
      } else {
        setSubmitError(text.saveFailed);
      }
      setSubmitting(false);
      showTop();
    }
  };

  const kindLabel: Record<FabricKind, string> = {
    MAIN: text.kindMain,
    RIB: text.kindRib,
    AUXILIARY: text.kindAux,
    OTHER: text.kindOther,
  };
  const processLabel: Record<ExternalProcess, string> = {
    PRINT: text.print,
    EMBROIDERY: text.embroidery,
    WASH: text.wash,
  };
  const twoColumns = { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <div ref={topRef} />
      {submitError && <Alert severity="error">{submitError}</Alert>}
      {Object.keys(errors).length > 0 && <Alert severity="warning">{text.fixErrors}</Alert>}

      <SectionCard title={text.secOrder}>
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: '1fr 220px', lg: '1fr 260px' },
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: twoColumns }}>
              <TextField
                required
                label={text.workOrderNumber}
                value={values.workOrderNumber}
                onChange={(event) => setField('workOrderNumber', event.target.value)}
                error={Boolean(errors.workOrderNumber)}
                helperText={errors.workOrderNumber}
              />
              <Autocomplete
                freeSolo
                options={[...clients]}
                inputValue={values.client}
                onInputChange={(_, input) => setField('client', input)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label={text.client}
                    error={Boolean(errors.client)}
                    helperText={errors.client ?? text.clientHint}
                  />
                )}
              />
              <TextField
                required
                label={text.modelName}
                value={values.modelName}
                onChange={(event) => setField('modelName', event.target.value)}
                error={Boolean(errors.modelName)}
                helperText={errors.modelName}
              />
              <Autocomplete
                freeSolo
                options={[...GARMENT_TYPES]}
                inputValue={values.garmentType}
                onInputChange={(_, input) => setField('garmentType', input)}
                renderInput={(params) => <TextField {...params} label={text.garmentType} />}
              />
              <TextField
                required
                label={text.clientStyle}
                value={values.clientStyle}
                onChange={(event) => setField('clientStyle', event.target.value)}
                error={Boolean(errors.clientStyle)}
                helperText={errors.clientStyle}
              />
              <TextField
                required
                label={text.ourStyle}
                value={values.ourStyle}
                onChange={(event) => setField('ourStyle', event.target.value)}
                error={Boolean(errors.ourStyle)}
                helperText={errors.ourStyle}
              />
              <TextField
                required
                type="date"
                label={text.startDate}
                value={values.startDate}
                onChange={(event) => setField('startDate', event.target.value)}
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="number"
                label={text.modelTime}
                value={values.modelTimeMinutes}
                onChange={(event) => setField('modelTimeMinutes', event.target.value)}
                inputProps={{ min: 0, step: 'any' }}
              />
            </Box>

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.8125rem' }}>
                {text.processes}
              </FormLabel>
              <FormGroup row>
                {PROCESSES.map((process) => (
                  <FormControlLabel
                    key={process}
                    label={processLabel[process]}
                    control={
                      <Checkbox checked={values.processes.includes(process)} onChange={() => toggleProcess(process)} />
                    }
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <ModelImageUpload
              value={values.imageUrl}
              onChange={(url) => setField('imageUrl', url ?? '')}
            />
          </Box>
        </Box>
      </SectionCard>

      <SectionCard title={text.secPos} description={text.secPosDesc}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {values.pos.map((row) => (
            <Box
              key={row.id}
              sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) 40px', alignItems: 'start' }}
            >
              <TextField
                required
                label={text.poNumber}
                value={row.poNumber}
                onChange={(event) => patchPo(row.id, { poNumber: event.target.value })}
                error={Boolean(errors[`pos.${row.id}.poNumber`])}
                helperText={errors[`pos.${row.id}.poNumber`]}
              />
              <TextField
                required
                type="number"
                label={text.poQty}
                value={row.quantity}
                onChange={(event) => patchPo(row.id, { quantity: event.target.value })}
                error={Boolean(errors[`pos.${row.id}.quantity`])}
                helperText={errors[`pos.${row.id}.quantity`]}
                inputProps={{ min: 0, step: 1 }}
              />
              <TextField
                required
                type="date"
                label={text.poDelivery}
                value={row.deliveryDate}
                onChange={(event) => patchPo(row.id, { deliveryDate: event.target.value })}
                error={Boolean(errors[`pos.${row.id}.deliveryDate`])}
                helperText={errors[`pos.${row.id}.deliveryDate`]}
                InputLabelProps={{ shrink: true }}
              />
              <Tooltip title={values.pos.length === 1 ? text.keepOne : text.remove}>
                <span>
                  <IconButton
                    aria-label={text.remove}
                    disabled={values.pos.length === 1}
                    onClick={() => update({ ...values, pos: values.pos.filter((candidate) => candidate.id !== row.id) })}
                    sx={{ mt: 0.5 }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Button startIcon={<Plus size={16} />} onClick={() => update({ ...values, pos: [...values.pos, newPoRow()] })}>
              {text.addPo}
            </Button>
            <Typography variant="body2" color="text.secondary">
              {text.poTotal}:{' '}
              <Box component="strong" sx={{ color: 'text.primary' }}>
                {formatNumber(poTotal)}
              </Box>
            </Typography>
          </Box>
          {errors.pos && (
            <Typography variant="caption" color="error">
              {errors.pos}
            </Typography>
          )}
        </Box>
      </SectionCard>

      <SectionCard title={text.secFabrics} description={`${text.secFabricsDesc} ${text.secFabricsHint}`}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {values.fabrics.map((row) => (
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
              <FormControl>
                <InputLabel id={`kind-${row.id}`}>{text.fabricKind}</InputLabel>
                <Select
                  labelId={`kind-${row.id}`}
                  label={text.fabricKind}
                  value={row.kind}
                  onChange={(event) => patchFabric(row.id, { kind: event.target.value as FabricKind })}
                >
                  {KINDS.map((kind) => (
                    <MenuItem key={kind} value={kind}>
                      {kindLabel[kind]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                required
                label={text.fabricName}
                value={row.name}
                onChange={(event) => patchFabric(row.id, { name: event.target.value })}
                error={Boolean(errors[`fabrics.${row.id}.name`])}
                helperText={errors[`fabrics.${row.id}.name`]}
              />
              <TextField
                type="number"
                label={text.weight}
                value={row.weightGsm}
                onChange={(event) => patchFabric(row.id, { weightGsm: event.target.value })}
                inputProps={{ min: 0, step: 'any' }}
              />
              <TextField
                label={text.yarn}
                placeholder="40/1"
                value={row.yarnCount}
                onChange={(event) => patchFabric(row.id, { yarnCount: event.target.value })}
              />
              <Tooltip title={values.fabrics.length === 1 ? text.keepOne : text.remove}>
                <span>
                  <IconButton
                    aria-label={text.remove}
                    disabled={values.fabrics.length === 1}
                    onClick={() =>
                      update({ ...values, fabrics: values.fabrics.filter((candidate) => candidate.id !== row.id) })
                    }
                    sx={{ mt: 0.5 }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <TextField
                label={text.composition}
                placeholder="100% C"
                value={row.composition}
                onChange={(event) => patchFabric(row.id, { composition: event.target.value })}
              />
              <TextField
                type="number"
                label={text.consumption}
                value={row.consumptionPerPiece}
                onChange={(event) => patchFabric(row.id, { consumptionPerPiece: event.target.value })}
                inputProps={{ min: 0, step: 'any' }}
              />
              <FormControl>
                <InputLabel id={`unit-${row.id}`}>{text.unit}</InputLabel>
                <Select
                  labelId={`unit-${row.id}`}
                  label={text.unit}
                  value={row.consumptionUnit}
                  onChange={(event) => patchFabric(row.id, { consumptionUnit: event.target.value as FabricUnit })}
                >
                  {FABRIC_UNITS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                label={text.combed}
                control={
                  <Checkbox checked={row.combed} onChange={(event) => patchFabric(row.id, { combed: event.target.checked })} />
                }
              />
            </Box>
          ))}
          <Box>
            <Button
              startIcon={<Plus size={16} />}
              onClick={() => update({ ...values, fabrics: [...values.fabrics, newFabricRow('RIB')] })}
            >
              {text.addFabric}
            </Button>
          </Box>
        </Box>
      </SectionCard>

      <WorkOrderColorsSection
        text={text}
        sizes={values.sizes}
        colors={values.colors}
        fabrics={values.fabrics}
        poTotal={poTotal}
        errors={errors}
        onSizesChange={(sizes) => update(pruneSizeData(values, sizes))}
        onColorsChange={(colors) => update({ ...values, colors })}
      />

      <WorkOrderMeasurementsSection
        text={text}
        sizes={values.sizes}
        measurements={values.measurements}
        onChange={(measurements) => update({ ...values, measurements })}
      />

      {(['OPERATION', 'PACKING'] as const).map((section) => (
        <WorkOrderAccessoriesSection
          key={section}
          text={text}
          section={section}
          sizes={values.sizes}
          colors={values.colors}
          accessories={values.accessories}
          errors={errors}
          onChange={(accessories) => update({ ...values, accessories })}
        />
      ))}

      <SectionCard title={text.secNotes}>
        <TextField
          fullWidth
          multiline
          minRows={5}
          label={text.notesLabel}
          value={values.notes}
          onChange={(event) => setField('notes', event.target.value)}
        />
      </SectionCard>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button color="inherit" onClick={handleCancel} disabled={submitting}>
          {text.cancel}
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? text.saving : text.save}
        </Button>
      </Box>
    </Box>
  );
}
