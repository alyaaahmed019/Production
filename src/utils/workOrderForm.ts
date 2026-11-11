/**
 * Form side of the work order: the values as typed (strings), conversion to the real data,
 * and the Arabic / English texts. Inputs always hold strings; numbers are parsed on save.
 */
import type { Locale } from '../contexts/I18nContext';
import { newId } from '../services/localDb';
import type {
  AccessoryBasis,
  AccessoryLine,
  AccessorySection,
  AccessorySource,
  AccessoryUnit,
  ColorLine,
  ExternalProcess,
  FabricKind,
  FabricSpec,
  FabricUnit,
  MeasurementRow,
  WorkOrder,
  WorkOrderInput,
} from '../types/workOrder';
import type { WorkOrderIssue } from './workOrderCalc';

export interface SizeRow {
  id: string;
  label: string;
}
export interface PoRow {
  id: string;
  poNumber: string;
  quantity: string;
  deliveryDate: string;
}
export interface FabricRow {
  id: string;
  kind: FabricKind;
  name: string;
  weightGsm: string;
  yarnCount: string;
  combed: boolean;
  composition: string;
  consumptionPerPiece: string;
  consumptionUnit: FabricUnit;
}
export interface ColorRow {
  id: string;
  name: string;
  /** Pieces per bag for each size, keyed by the SIZE ROW ID (so renaming a size loses nothing). */
  ratio: Record<string, string>;
  orderQuantity: string;
  extraPercent: string;
  /** Color of each non-main fabric for this color, keyed by fabric id. Empty = same as the color. */
  fabricColors: Record<string, string>;
}
export interface MeasureRow {
  id: string;
  name: string;
  from: string;
  to: string;
  /** Value per size, keyed by SIZE ROW ID. */
  values: Record<string, string>;
}
export interface AccessoryRow {
  id: string;
  section: AccessorySection;
  name: string;
  spec: string;
  unit: AccessoryUnit;
  source: AccessorySource;
  accessoryQty: string;
  garmentQty: string;
  basis: AccessoryBasis;
  bySize: boolean;
  /** Spec per size, keyed by SIZE ROW ID. */
  specs: Record<string, string>;
}

export interface WorkOrderFormValues {
  workOrderNumber: string;
  client: string;
  garmentType: string;
  modelName: string;
  clientStyle: string;
  ourStyle: string;
  startDate: string;
  modelTimeMinutes: string;
  processes: ExternalProcess[];
  sizes: SizeRow[];
  pos: PoRow[];
  fabrics: FabricRow[];
  colors: ColorRow[];
  measurements: MeasureRow[];
  accessories: AccessoryRow[];
  notes: string;
  imageUrl?: string;
}

export const SIZE_PRESETS: readonly { id: string; label: string; sizes: readonly string[] }[] = [
  { id: 'numeric', label: '1 – 12', sizes: Array.from({ length: 12 }, (_, index) => String(index + 1)) },
  { id: 'letters', label: 'S – XXL', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'wide', label: 'XS – XXL', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
];

export const GARMENT_TYPES: readonly string[] = ['رجالي', 'حريمي', 'أطفال', 'Men', 'Women', 'Kids'];

export function newSizeRow(label = ''): SizeRow {
  return { id: newId(), label };
}
export function newPoRow(): PoRow {
  return { id: newId(), poNumber: '', quantity: '', deliveryDate: '' };
}
export function newFabricRow(kind: FabricKind = 'MAIN'): FabricRow {
  return {
    id: newId(),
    kind,
    name: '',
    weightGsm: '',
    yarnCount: '',
    combed: false,
    composition: '',
    consumptionPerPiece: '',
    consumptionUnit: 'kg',
  };
}
export function newColorRow(): ColorRow {
  return { id: newId(), name: '', ratio: {}, orderQuantity: '', extraPercent: '', fabricColors: {} };
}
export function newMeasureRow(): MeasureRow {
  return { id: newId(), name: '', from: '', to: '', values: {} };
}
export function newAccessoryRow(section: AccessorySection): AccessoryRow {
  return {
    id: newId(),
    section,
    name: '',
    spec: '',
    unit: 'PC',
    source: 'LOCAL',
    accessoryQty: '1',
    garmentQty: '1',
    basis: 'ORDER',
    bySize: false,
    specs: {},
  };
}

export const ACCESSORY_UNITS: readonly AccessoryUnit[] = ['PC', 'm', 'kg', 'roll'];
export const ACCESSORY_SOURCES: readonly AccessorySource[] = ['LOCAL', 'IMPORTED', 'NOMINATED'];

/** A, B, C ... AA, AB ... for the measurement points. */
export function measurementCode(index: number): string {
  const letter = (n: number) => String.fromCharCode(65 + (n % 26));
  return index < 26 ? letter(index) : letter(Math.floor(index / 26) - 1) + letter(index);
}

/** Drops everything typed for sizes that no longer exist (removed sizes, or a new preset). */
export function pruneSizeData(values: WorkOrderFormValues, sizes: WorkOrderFormValues['sizes']): WorkOrderFormValues {
  const keep = new Set(sizes.map((size) => size.id));
  const only = (record: Record<string, string>) =>
    Object.fromEntries(Object.entries(record).filter(([id]) => keep.has(id)));
  return {
    ...values,
    sizes,
    colors: values.colors.map((row) => ({ ...row, ratio: only(row.ratio) })),
    measurements: values.measurements.map((row) => ({ ...row, values: only(row.values) })),
    accessories: values.accessories.map((row) => ({ ...row, specs: only(row.specs) })),
  };
}

export function emptyFormValues(today: string): WorkOrderFormValues {
  return {
    workOrderNumber: '',
    client: '',
    garmentType: '',
    modelName: '',
    clientStyle: '',
    ourStyle: '',
    startDate: today,
    modelTimeMinutes: '',
    processes: [],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'].map(newSizeRow),
    pos: [newPoRow()],
    fabrics: [newFabricRow('MAIN')],
    colors: [newColorRow()],
    measurements: [],
    accessories: [],
    notes: '',
    imageUrl: '',
  };
}

// ─── Conversion ──────────────────────────────────────────────────────────────

/** NaN when empty or not a number. Accepts "1,5" as well as "1.5". */
export function toNumber(value: string): number {
  const text = value.trim().replace(',', '.');
  return text === '' ? Number.NaN : Number(text);
}

function optionalNumber(value: string): number | undefined {
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** A color line for live previews: the ratio is keyed by size row id, so `sizeIds` is the size list. */
export function colorRowToLine(row: ColorRow, sizeIds: readonly string[]): ColorLine {
  const ratio: Record<string, number> = {};
  for (const id of sizeIds) {
    const parsed = toNumber(row.ratio[id] ?? '');
    ratio[id] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }
  const quantity = toNumber(row.orderQuantity);
  const extra = row.extraPercent.trim() === '' ? 0 : toNumber(row.extraPercent);
  return { id: row.id, name: row.name, ratio, orderQuantity: quantity, extraPercent: extra, fabricColors: row.fabricColors };
}

/** A fabric for live previews (the saved order uses formValuesToInput). */
export function fabricRowToSpec(row: FabricRow): FabricSpec {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    weightGsm: optionalNumber(row.weightGsm),
    yarnCount: row.yarnCount.trim() || undefined,
    combed: row.combed,
    composition: row.composition.trim() || undefined,
    consumptionPerPiece: optionalNumber(row.consumptionPerPiece),
    consumptionUnit: row.consumptionUnit,
  };
}

export function formValuesToInput(values: WorkOrderFormValues): WorkOrderInput {
  const usedSizes = values.sizes.filter((size) => size.label.trim() !== '');
  return {
    workOrderNumber: values.workOrderNumber,
    client: values.client,
    garmentType: values.garmentType,
    modelName: values.modelName,
    clientStyle: values.clientStyle,
    ourStyle: values.ourStyle,
    startDate: values.startDate,
    modelTimeMinutes: optionalNumber(values.modelTimeMinutes),
    processes: values.processes,
    sizes: usedSizes.map((size) => size.label.trim()),
    pos: values.pos.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      quantity: toNumber(po.quantity),
      deliveryDate: po.deliveryDate,
    })),
    fabrics: values.fabrics.map((fabric) => ({
      id: fabric.id,
      kind: fabric.kind,
      name: fabric.name,
      weightGsm: optionalNumber(fabric.weightGsm),
      yarnCount: fabric.yarnCount.trim() || undefined,
      combed: fabric.combed,
      composition: fabric.composition.trim() || undefined,
      consumptionPerPiece: optionalNumber(fabric.consumptionPerPiece),
      consumptionUnit: fabric.consumptionUnit,
    })),
    colors: values.colors.map((row) => {
      const line = colorRowToLine(row, usedSizes.map((size) => size.id));
      const ratio: Record<string, number> = {};
      for (const size of usedSizes) {
        const inBag = line.ratio[size.id];
        if (inBag > 0) ratio[size.label.trim()] = inBag;
      }
      const fabricColors: Record<string, string> = {};
      for (const fabric of values.fabrics) {
        const own = (row.fabricColors[fabric.id] ?? '').trim();
        if (own) fabricColors[fabric.id] = own;
      }
      return { ...line, ratio, fabricColors };
    }),
    measurements: values.measurements.map<MeasurementRow>((row, index) => {
      const sizeValues: Record<string, string> = {};
      for (const size of usedSizes) {
        const typed = (row.values[size.id] ?? '').trim();
        if (typed) sizeValues[size.label.trim()] = typed;
      }
      return {
        id: row.id,
        code: measurementCode(index),
        name: row.name.trim(),
        measureFrom: row.from.trim(),
        measureTo: row.to.trim(),
        values: sizeValues,
      };
    }),
    accessories: values.accessories.map<AccessoryLine>((row) => {
      const specsBySize: Record<string, string> = {};
      for (const size of usedSizes) {
        const typed = (row.specs[size.id] ?? '').trim();
        if (typed) specsBySize[size.label.trim()] = typed;
      }
      return {
        id: row.id,
        section: row.section,
        name: row.name,
        spec: row.spec.trim(),
        unit: row.unit,
        source: row.source,
        accessoryQty: toNumber(row.accessoryQty),
        garmentQty: toNumber(row.garmentQty),
        basis: row.basis,
        bySize: row.bySize,
        specsBySize,
      };
    }),
    // Packing rules, label and sign-off are filled by later screens.
    packing: { singleColorPerCarton: true, singleSizePerCarton: true },
    mainLabelName: '',
    accessoryPlacements: [],
    notes: values.notes,
    imageUrl: values.imageUrl?.trim() ? values.imageUrl : undefined,
    signOff: { preparedBy: '', reviewedBy: '', approvedBy: '' },
  };
}

/** Opens a saved work order in the form (edit mode). Ratios and per-size data are re-keyed by size row id. */
export function workOrderToFormValues(order: WorkOrder): WorkOrderFormValues {
  const sizes = order.sizes.map((label) => newSizeRow(label));
  const idOf = new Map(sizes.map((size) => [size.label, size.id]));
  const rekey = <T,>(record: Record<string, T> | undefined, map: (value: T) => string) => {
    const result: Record<string, string> = {};
    for (const [label, value] of Object.entries(record ?? {})) {
      const id = idOf.get(label);
      if (id) result[id] = map(value);
    }
    return result;
  };
  const text = (value: number | undefined) => (value === undefined || value === null ? '' : String(value));

  return {
    workOrderNumber: order.workOrderNumber,
    client: order.client,
    garmentType: order.garmentType,
    modelName: order.modelName,
    clientStyle: order.clientStyle,
    ourStyle: order.ourStyle,
    startDate: order.startDate,
    modelTimeMinutes: text(order.modelTimeMinutes),
    processes: [...order.processes],
    sizes,
    pos: order.pos.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      quantity: String(po.quantity),
      deliveryDate: po.deliveryDate,
    })),
    fabrics: order.fabrics.map((fabric) => ({
      id: fabric.id,
      kind: fabric.kind,
      name: fabric.name,
      weightGsm: text(fabric.weightGsm),
      yarnCount: fabric.yarnCount ?? '',
      combed: fabric.combed,
      composition: fabric.composition ?? '',
      consumptionPerPiece: text(fabric.consumptionPerPiece),
      consumptionUnit: fabric.consumptionUnit,
    })),
    colors: order.colors.map((color) => ({
      id: color.id,
      name: color.name,
      ratio: rekey(color.ratio, String),
      orderQuantity: String(color.orderQuantity),
      extraPercent: color.extraPercent ? String(color.extraPercent) : '',
      fabricColors: { ...(color.fabricColors ?? {}) },
    })),
    measurements: (order.measurements ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      from: row.measureFrom,
      to: row.measureTo,
      values: rekey(row.values, String),
    })),
    accessories: (order.accessories ?? []).map((row) => ({
      id: row.id,
      section: row.section,
      name: row.name,
      spec: row.spec,
      unit: row.unit,
      source: row.source,
      accessoryQty: String(row.accessoryQty),
      garmentQty: String(row.garmentQty),
      basis: row.basis,
      bySize: row.bySize,
      specs: rekey(row.specsBySize, String),
    })),
    notes: order.notes,
    imageUrl: order.imageUrl ?? '',
  };
}

// ─── Texts ───────────────────────────────────────────────────────────────────

const ar = {
  pageTitle: 'أمر تشغيل جديد',
  pageSubtitle: 'سجّل بيانات الموديل والـ PO والألوان. الحفظ بيتم على هذا الجهاز أولًا.',
  back: 'أوامر التشغيل',
  secOrder: 'بيانات الأمر',
  secPos: 'أرقام الـ PO',
  secPosDesc: 'لكل PO كميته وتاريخ شحنه.',
  secFabrics: 'الخامات',
  secFabricsDesc: 'أساسي، ريب، مساعد... مع استهلاك القطعة.',
  secSizes: 'المقاسات',
  secSizesDesc: 'مقاسات هذا الأمر فقط. تقدر تختار مجموعة جاهزة أو تكتب بنفسك.',
  secColors: 'الألوان والنسب (الرشيو)',
  secColorsDesc: 'أدخل نسبة كل مقاس (مثلاً S:1, M:2, L:1) والكمية الكلية لكل لون، وسيتم توزيع الكميات على المقاسات تلقائيًا.',
  secSummary: 'كميات القص',
  secCuttingDesc: 'حساب كميات القص: استهلاك القطعة × عدد القطع لكل مقاس',
  secNotes: 'ملاحظات',
  workOrderNumber: 'رقم التشغيل',
  client: 'العميل',
  clientHint: 'اختر عميلًا سابقًا أو اكتب اسمًا جديدًا.',
  garmentType: 'النوع (رجالي / حريمي / أطفال)',
  modelName: 'اسم الموديل',
  clientStyle: 'ستايل العميل',
  ourStyle: 'ستايلنا',
  startDate: 'تاريخ بداية التشغيل',
  modelTime: 'زمن الموديل (دقيقة)',
  processes: 'عمليات خارج الخط',
  print: 'طباعة',
  embroidery: 'تطريز',
  wash: 'غسيل',
  poNumber: 'رقم الـ PO',
  poQty: 'الكمية',
  poDelivery: 'تاريخ الشحن',
  addPo: 'إضافة PO',
  poTotal: 'إجمالي كميات الـ PO',
  fabricKind: 'النوع',
  kindMain: 'أساسي',
  kindRib: 'ريب',
  kindAux: 'مساعد',
  kindOther: 'أخرى',
  fabricName: 'اسم الخامة',
  weight: 'الوزن (جم/م²)',
  yarn: 'النمرة (NE)',
  combed: 'ممشط',
  composition: 'التركيب',
  consumption: 'استهلاك القطعة',
  unit: 'الوحدة',
  addFabric: 'إضافة خامة',
  size: 'مقاس',
  addSize: 'إضافة مقاس',
  presets: 'مجموعات جاهزة:',
  color: 'اللون',
  bag: 'إجمالي النسبة',
  bagTip: 'مجموع نسب المقاسات لهذا اللون (الرشيو)',
  quantity: 'الكمية الكلية',
  extra: 'زيادة %',
  toCut: 'مطلوب قص',
  bags: 'تكرار النسبة',
  addColor: 'إضافة لون',
  ordered: 'إجمالي كميات الألوان',
  extraPieces: 'الزيادة',
  cutTotal: 'إجمالي القص',
  total: 'الإجمالي',
  colorsTotal: 'إجمالي كميات الألوان',
  remove: 'حذف',
  keepOne: 'لازم يفضل صف واحد على الأقل',
  notesLabel: 'ملاحظات خدمة العملاء',
  cancel: 'إلغاء',
  save: 'حفظ أمر التشغيل',
  saving: 'جارٍ الحفظ…',
  fixErrors: 'صحّح الحقول المظللة قبل الحفظ.',
  saveFailed: 'تعذّر حفظ الأمر. حاول مرة أخرى.',
  savedTitle: 'تم حفظ أمر التشغيل',
  savedBody: 'الأمر محفوظ على هذا الجهاز.',
  newOrder: 'أمر جديد',
  backToList: 'رجوع لقائمة الأوامر',
  errRequired: 'هذا الحقل مطلوب',
  errSizesRequired: 'أضف مقاسًا واحدًا على الأقل',
  errSizeDuplicate: (size: string) => `المقاس ${size} مكرر`,
  errPoRequired: 'أضف رقم PO واحد على الأقل',
  errPoDuplicate: 'رقم الـ PO مكرر',
  errPoQuantity: 'اكتب كمية صحيحة أكبر من صفر',
  errPoDelivery: 'تاريخ الشحن قبل تاريخ البداية',
  errColorRequired: 'أضف لونًا واحدًا على الأقل',
  errColorName: 'اكتب اسم اللون',
  errColorDuplicate: (color: string) => `اللون ${color} مكرر`,
  errRatioEmpty: 'أدخل نسبة المقاسات (الرشيو)',
  errQuantity: 'اكتب كمية صحيحة أكبر من صفر',
  errNotWholeBags: (bag: number, lower: number, upper: number) =>
    `الكمية يجب أن تقبل القسمة على مجموع النسب (${bag}). الأقرب: ${lower > 0 ? `${lower} أو ` : ''}${upper}`,
  errExtra: 'النسبة من 0 إلى 100',
  errPoMismatch: (po: number, colors: number) =>
    `إجمالي كميات الـ PO (${po}) لا يساوي إجمالي كميات الألوان (${colors})`,
  errFabricName: 'اكتب اسم الخامة',
  errDuplicateWorkOrder: (number: string) => `رقم التشغيل ${number} موجود بالفعل`,
  errPoInOther: (po: string, workOrder: string) => `الـ PO ${po} موجود بالفعل في أمر التشغيل ${workOrder}`,
  modelImage: 'صورة الموديل',
  addImage: 'إضافة صورة',
  uploadImageHint: 'اسحب الصورة هنا أو اضغط للاختيار',
  uploadImageTypes: 'PNG أو JPG أو WEBP حتى 5 ميجابايت',
  changeImage: 'تغيير الصورة',
  removeImage: 'حذف الصورة',
  viewImage: 'تكبير الصورة',
  errImageTooLarge: 'حجم الصورة يتجاوز 5 ميجابايت',
  errImageInvalidType: 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)',
  exportPdf: 'استخراج ملف',
  requiredFabric: 'كمية القماش المطلوب',
  secFabricsHint: 'لون الريب أو الخامة المساعدة بيتحدد لكل لون في جدول «الألوان والنسب» — ولو فاضي يبقى نفس لون الخامة الرئيسية.',
  fabricColorOf: (kind: string) => `لون ${kind}`,
  sameColor: 'نفس اللون',
  secFabricByColor: 'القماش المطلوب حسب اللون',
  fabricCol: 'الخامة',
  fabricColorCol: 'لون القماش',
  quantityCol: 'الكمية',
  secMeasures: 'القياسات',
  secMeasuresDesc: 'اختياري. اكتب كل بعد وطريقة قياسه (من / إلى) وقياسه لكل مقاس.',
  measureName: 'البعد',
  measureFrom: 'من',
  measureTo: 'إلى',
  addMeasure: 'إضافة بعد',
  secAccOperation: 'اكسسوارات التشغيل',
  secAccPacking: 'اكسسوارات التعبئة',
  secAccDesc: 'اختر الصنف واكتب نسبته: كم قطعة اكسسوار لكل كم قطعة ملابس. الكمية بتتحسب من كميات الألوان. لو الاكسسوار له مقاسات اختار «له مقاسات».',
  accessory: 'الاكسسوار',
  accSpec: 'المواصفات',
  accSpecHint: 'مثال: 40*30',
  accUnit: 'الوحدة',
  accSource: 'المصدر',
  srcLocal: 'محلي',
  srcImported: 'مستورد',
  srcNominated: 'Nominated',
  accQty: 'عدد الاكسسوار',
  accPer: 'لكل عدد ملابس',
  accBasis: 'الحساب على',
  basisOrder: 'كمية الأوردر',
  basisCut: 'كمية القص (بعد الزيادة)',
  accBySize: 'له مقاسات',
  accTotal: 'الإجمالي',
  addAccessory: 'إضافة اكسسوار',
  errAccName: 'اكتب اسم الاكسسوار',
  errAccRatio: 'اكتب النسبة بأرقام أكبر من صفر',
  confirmLeave: 'الخروج من الفورم؟ التعديلات اللي ما اتحفظتش هتضيع.',
  editTitle: (n: string) => `تعديل أمر التشغيل ${n}`,
  editSubtitle: 'عدّل البيانات واحفظ. الحفظ بيتم على هذا الجهاز أولًا.',
  updatedBody: 'تم حفظ التعديلات على هذا الجهاز.',
  edit: 'تعديل',
  orderNotFound: 'أمر التشغيل غير موجود.',
  loadFailed: 'تعذّر تحميل أمر التشغيل.',
  retry: 'حاول مرة أخرى',
  imageTooBig: 'الصورة كبيرة، جرّب صورة أصغر',
};

export type FormText = typeof ar;

const en: FormText = {
  pageTitle: 'New Work Order',
  pageSubtitle: 'Enter the model, POs and colors. It is saved on this device first.',
  back: 'Work Orders',
  secOrder: 'Order information',
  secPos: 'PO numbers',
  secPosDesc: 'Each PO has its own quantity and shipping date.',
  secFabrics: 'Fabrics',
  secFabricsDesc: 'Main, rib, auxiliary... with consumption per piece.',
  secSizes: 'Sizes',
  secSizesDesc: 'Only the sizes of this order. Pick a preset or type your own.',
  secColors: 'Colors and ratio',
  secColorsDesc: 'Enter the ratio for each size (e.g. S:1, M:2, L:1) and the total quantity per color. Size quantities are calculated automatically.',
  secSummary: 'Cutting quantities',
  secCuttingDesc: 'Cutting quantities: consumption per piece × pieces per size',
  secNotes: 'Notes',
  workOrderNumber: 'Work order no.',
  client: 'Client',
  clientHint: 'Pick an existing client or type a new one.',
  garmentType: 'Type (men / women / kids)',
  modelName: 'Model name',
  clientStyle: 'Client style',
  ourStyle: 'Our style',
  startDate: 'Start date',
  modelTime: 'Model time (minutes)',
  processes: 'Outside processes',
  print: 'Print',
  embroidery: 'Embroidery',
  wash: 'Wash',
  poNumber: 'PO number',
  poQty: 'Quantity',
  poDelivery: 'Shipping date',
  addPo: 'Add PO',
  poTotal: 'PO quantity total',
  fabricKind: 'Type',
  kindMain: 'Main',
  kindRib: 'Rib',
  kindAux: 'Auxiliary',
  kindOther: 'Other',
  fabricName: 'Fabric name',
  weight: 'Weight (gsm)',
  yarn: 'Yarn count (NE)',
  combed: 'Combed',
  composition: 'Composition',
  consumption: 'Consumption per piece',
  unit: 'Unit',
  addFabric: 'Add fabric',
  size: 'Size',
  addSize: 'Add size',
  presets: 'Presets:',
  color: 'Color',
  bag: 'Total ratio',
  bagTip: 'Sum of size ratios for this color',
  quantity: 'Total quantity',
  extra: 'Extra %',
  toCut: 'To cut',
  bags: 'ratio units',
  addColor: 'Add color',
  ordered: 'Total colors quantity',
  extraPieces: 'Extra',
  cutTotal: 'Total to cut',
  total: 'Total',
  colorsTotal: 'Color quantity total',
  remove: 'Remove',
  keepOne: 'At least one row is required',
  notesLabel: 'Customer service notes',
  cancel: 'Cancel',
  save: 'Save work order',
  saving: 'Saving…',
  fixErrors: 'Fix the highlighted fields before saving.',
  saveFailed: 'The order could not be saved. Try again.',
  savedTitle: 'Work order saved',
  savedBody: 'The order is saved on this device.',
  newOrder: 'New order',
  backToList: 'Back to orders',
  errRequired: 'This field is required',
  errSizesRequired: 'Add at least one size',
  errSizeDuplicate: (size: string) => `Size ${size} is listed twice`,
  errPoRequired: 'Add at least one PO',
  errPoDuplicate: 'This PO number is listed twice',
  errPoQuantity: 'Enter a whole quantity above 0',
  errPoDelivery: 'Shipping date is before the start date',
  errColorRequired: 'Add at least one color',
  errColorName: 'Enter the color name',
  errColorDuplicate: (color: string) => `Color ${color} is listed twice`,
  errRatioEmpty: 'Enter the size ratios',
  errQuantity: 'Enter a whole quantity above 0',
  errNotWholeBags: (bag: number, lower: number, upper: number) =>
    `Quantity must be divisible by total ratio (${bag}). Closest: ${lower > 0 ? `${lower} or ` : ''}${upper}`,
  errExtra: 'Use a value from 0 to 100',
  errPoMismatch: (po: number, colors: number) =>
    `PO quantities total (${po}) does not match color quantities total (${colors})`,
  errFabricName: 'Enter the fabric name',
  errDuplicateWorkOrder: (number: string) => `Work order number ${number} already exists`,
  errPoInOther: (po: string, workOrder: string) => `PO ${po} is already in work order ${workOrder}`,
  modelImage: 'Model image',
  addImage: 'Add image',
  uploadImageHint: 'Drag & drop image here or click to browse',
  uploadImageTypes: 'PNG, JPG, WEBP up to 5MB',
  changeImage: 'Change image',
  removeImage: 'Remove image',
  viewImage: 'View full size',
  errImageTooLarge: 'Image file size exceeds 5MB',
  errImageInvalidType: 'Please choose a valid image file (PNG, JPG, WEBP)',
  exportPdf: 'Export PDF',
  requiredFabric: 'Required fabric',
  secFabricsHint: 'The color of the rib or auxiliary fabric is set per color in the "Colors and ratio" table. If left empty it is the same as the main fabric color.',
  fabricColorOf: (kind: string) => `${kind} color`,
  sameColor: 'Same color',
  secFabricByColor: 'Fabric required by color',
  fabricCol: 'Fabric',
  fabricColorCol: 'Fabric color',
  quantityCol: 'Quantity',
  secMeasures: 'Measurements',
  secMeasuresDesc: 'Optional. Enter each dimension, how it is measured (from / to) and its value for every size.',
  measureName: 'Dimension',
  measureFrom: 'From',
  measureTo: 'To',
  addMeasure: 'Add dimension',
  secAccOperation: 'Operation accessories',
  secAccPacking: 'Packing accessories',
  secAccDesc: 'Pick the item and enter its ratio: how many accessories for how many garments. The quantity is calculated from the color quantities. Tick "Has sizes" if the accessory differs per size.',
  accessory: 'Accessory',
  accSpec: 'Specification',
  accSpecHint: 'e.g. 40*30',
  accUnit: 'Unit',
  accSource: 'Source',
  srcLocal: 'Local',
  srcImported: 'Imported',
  srcNominated: 'Nominated',
  accQty: 'Accessories',
  accPer: 'Per garments',
  accBasis: 'Calculate on',
  basisOrder: 'Order quantity',
  basisCut: 'Cut quantity (with extra)',
  accBySize: 'Has sizes',
  accTotal: 'Total',
  addAccessory: 'Add accessory',
  errAccName: 'Enter the accessory name',
  errAccRatio: 'Enter the ratio as numbers above zero',
  confirmLeave: 'Leave the form? Unsaved changes will be lost.',
  editTitle: (n: string) => `Edit work order ${n}`,
  editSubtitle: 'Change the data and save. It is saved on this device first.',
  updatedBody: 'The changes are saved on this device.',
  edit: 'Edit',
  orderNotFound: 'Work order not found.',
  loadFailed: 'The work order could not be loaded.',
  retry: 'Try again',
  imageTooBig: 'The image is too large, try a smaller one',
};

export function getFormText(locale: Locale): FormText {
  return locale === 'ar' ? ar : en;
}

function messageFor(issue: WorkOrderIssue, text: FormText): string {
  const params = issue.params ?? {};
  switch (issue.code) {
    case 'REQUIRED':
      return text.errRequired;
    case 'SIZES_REQUIRED':
      return text.errSizesRequired;
    case 'SIZE_DUPLICATE':
      return text.errSizeDuplicate(String(params.size ?? ''));
    case 'PO_REQUIRED':
      return text.errPoRequired;
    case 'PO_DUPLICATE':
      return text.errPoDuplicate;
    case 'PO_QUANTITY_INVALID':
      return text.errPoQuantity;
    case 'PO_DELIVERY_BEFORE_START':
      return text.errPoDelivery;
    case 'COLOR_REQUIRED':
      return issue.path === 'colors' ? text.errColorRequired : text.errColorName;
    case 'COLOR_DUPLICATE':
      return text.errColorDuplicate(String(params.color ?? ''));
    case 'RATIO_EMPTY':
      return text.errRatioEmpty;
    case 'QUANTITY_INVALID':
      return text.errQuantity;
    case 'NOT_WHOLE_BAGS':
      return text.errNotWholeBags(Number(params.bagSize), Number(params.lower), Number(params.upper));
    case 'EXTRA_PERCENT_INVALID':
      return text.errExtra;
    case 'PO_TOTAL_MISMATCH':
      return text.errPoMismatch(Number(params.poPieces), Number(params.orderedPieces));
    case 'FABRIC_NAME_REQUIRED':
      return text.errFabricName;
    case 'ACCESSORY_NAME_REQUIRED':
      return text.errAccName;
    case 'ACCESSORY_RATIO_INVALID':
      return text.errAccRatio;
  }
}

/** Turns issues into one message per field. All size problems are shown together under "sizes". */
export function issuesToMessages(issues: readonly WorkOrderIssue[], text: FormText): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.startsWith('sizes') ? 'sizes' : issue.path;
    const message = messageFor(issue, text);
    messages[key] = messages[key] ? `${messages[key]} · ${message}` : message;
  }
  return messages;
}
