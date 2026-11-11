/**
 * Generates a print-ready HTML document for a WorkOrder and opens it in a new window.
 * Uses CSS @media print so the user can Save as PDF via the browser's print dialog.
 * No external dependencies required.
 */
import type { WorkOrder } from '../types/workOrder';
import { formatDate, formatNumber } from './format';
import { calculateAccessory, calculateWorkOrderTotals, fabricColorOf, fabricRequirements, planColor } from './workOrderCalc';

type Locale = 'ar' | 'en';

// ─── String tables ────────────────────────────────────────────────────────────

interface PdfStrings {
  brand: string;
  docTitle: (n: string) => string;
  orderInfo: string;
  workOrderNumber: string;
  client: string;
  modelName: string;
  garmentType: string;
  clientStyle: string;
  ourStyle: string;
  startDate: string;
  modelTime: string;
  minutes: string;
  processes: string;
  pos: string;
  poNumber: string;
  poQty: string;
  poDelivery: string;
  poTotal: string;
  fabrics: string;
  fabricKind: string;
  fabricName: string;
  weight: string;
  yarn: string;
  combed: string;
  composition: string;
  consumption: string;
  sizes: string;
  colors: string;
  color: string;
  totalRatio: string;
  quantity: string;
  extra: string;
  toCut: string;
  cuttingQty: string;
  totalRow: string;
  cutTotal: string;
  cutTotalPieces: string;
  requiredFabric: string;
  modelImage: string;
  notes: string;
  signOff: string;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  yes: string;
  no: string;
  kindMain: string;
  kindRib: string;
  kindAux: string;
  kindOther: string;
  print: string;
  embroidery: string;
  wash: string;
  pcs: string;
  orderedPieces: string;
  extraPieces: string;
  printBtn: string;
  closeBtn: string;
  fabricByColor: string;
  fabricColor: string;
  measures: string;
  measureName: string;
  measureFrom: string;
  measureTo: string;
  accessories: string;
  accessory: string;
  accSpec: string;
  accSource: string;
  accRatio: string;
  accTotal: string;
  accOperation: string;
  accPacking: string;
  srcLocal: string;
  srcImported: string;
  srcNominated: string;
}

const STRINGS: Record<Locale, PdfStrings> = {
  ar: {
    brand: 'LoomWorks',
    docTitle: (n: string) => `أمر تشغيل ${n}`,
    orderInfo: 'بيانات الأمر',
    workOrderNumber: 'رقم التشغيل',
    client: 'العميل',
    modelName: 'اسم الموديل',
    garmentType: 'النوع',
    clientStyle: 'ستايل العميل',
    ourStyle: 'ستايلنا',
    startDate: 'تاريخ البداية',
    modelTime: 'زمن الموديل',
    minutes: 'دقيقة',
    processes: 'عمليات خارج الخط',
    pos: 'أرقام الـ PO',
    poNumber: 'رقم الـ PO',
    poQty: 'الكمية',
    poDelivery: 'تاريخ الشحن',
    poTotal: 'الإجمالي',
    fabrics: 'الخامات',
    fabricKind: 'النوع',
    fabricName: 'الخامة',
    weight: 'الوزن (جم/م²)',
    yarn: 'النمرة',
    combed: 'ممشط',
    composition: 'التركيب',
    consumption: 'استهلاك القطعة',
    sizes: 'المقاسات',
    colors: 'الألوان والرشيو',
    color: 'اللون',
    totalRatio: 'إجمالي النسبة',
    quantity: 'الكمية الكلية',
    extra: 'زيادة %',
    toCut: 'مطلوب قص',
    cuttingQty: 'كميات القص',
    totalRow: 'الإجمالي',
    cutTotal: 'إجمالي القص',
    cutTotalPieces: 'إجمالي القص (قطعة)',
    requiredFabric: 'كمية القماش المطلوب',
    modelImage: 'صورة الموديل',
    notes: 'ملاحظات',
    signOff: 'التوقيعات',
    preparedBy: 'أعده',
    reviewedBy: 'راجعه',
    approvedBy: 'اعتمده',
    yes: 'نعم',
    no: 'لا',
    kindMain: 'أساسي',
    kindRib: 'ريب',
    kindAux: 'مساعد',
    kindOther: 'أخرى',
    print: 'طباعة',
    embroidery: 'تطريز',
    wash: 'غسيل',
    pcs: 'قطعة',
    orderedPieces: 'إجمالي عدد القطع',
    extraPieces: 'الزيادة',
    printBtn: 'طباعة / حفظ PDF',
    closeBtn: 'إغلاق',
    fabricByColor: 'القماش المطلوب حسب اللون',
    fabricColor: 'لون القماش',
    measures: 'القياسات',
    measureName: 'البعد',
    measureFrom: 'من',
    measureTo: 'إلى',
    accessories: 'الاكسسوارات',
    accessory: 'الاكسسوار',
    accSpec: 'المواصفات',
    accSource: 'المصدر',
    accRatio: 'النسبة',
    accTotal: 'الإجمالي',
    accOperation: 'تشغيل',
    accPacking: 'تعبئة',
    srcLocal: 'محلي',
    srcImported: 'مستورد',
    srcNominated: 'Nominated',
  },
  en: {
    brand: 'LoomWorks',
    docTitle: (n: string) => `Work Order ${n}`,
    orderInfo: 'Order information',
    workOrderNumber: 'Work order no.',
    client: 'Client',
    modelName: 'Model name',
    garmentType: 'Type',
    clientStyle: 'Client style',
    ourStyle: 'Our style',
    startDate: 'Start date',
    modelTime: 'Model time',
    minutes: 'min',
    processes: 'Outside processes',
    pos: 'PO numbers',
    poNumber: 'PO number',
    poQty: 'Quantity',
    poDelivery: 'Shipping date',
    poTotal: 'Total',
    fabrics: 'Fabrics',
    fabricKind: 'Type',
    fabricName: 'Fabric',
    weight: 'Weight (gsm)',
    yarn: 'Yarn count',
    combed: 'Combed',
    composition: 'Composition',
    consumption: 'Consumption',
    sizes: 'Sizes',
    colors: 'Colors & ratio',
    color: 'Color',
    totalRatio: 'Total ratio',
    quantity: 'Total qty',
    extra: 'Extra %',
    toCut: 'To cut',
    cuttingQty: 'Cutting quantities',
    totalRow: 'Total',
    cutTotal: 'Total to cut',
    cutTotalPieces: 'Cut Total (pcs)',
    requiredFabric: 'Required fabric',
    modelImage: 'Model image',
    notes: 'Notes',
    signOff: 'Sign-off',
    preparedBy: 'Prepared by',
    reviewedBy: 'Reviewed by',
    approvedBy: 'Approved by',
    yes: 'Yes',
    no: 'No',
    kindMain: 'Main',
    kindRib: 'Rib',
    kindAux: 'Auxiliary',
    kindOther: 'Other',
    print: 'Print',
    embroidery: 'Embroidery',
    wash: 'Wash',
    pcs: 'pcs',
    orderedPieces: 'Total pieces',
    extraPieces: 'Extra pieces',
    printBtn: 'Print / Save PDF',
    closeBtn: 'Close',
    fabricByColor: 'Fabric required by color',
    fabricColor: 'Fabric color',
    measures: 'Measurements',
    measureName: 'Dimension',
    measureFrom: 'From',
    measureTo: 'To',
    accessories: 'Accessories',
    accessory: 'Accessory',
    accSpec: 'Specification',
    accSource: 'Source',
    accRatio: 'Ratio',
    accTotal: 'Total',
    accOperation: 'Operation',
    accPacking: 'Packing',
    srcLocal: 'Local',
    srcImported: 'Imported',
    srcNominated: 'Nominated',
  },
};

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function esc(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row2(label: string, value: string | number | undefined | null): string {
  if (!value && value !== 0) return '';
  return `<tr><td class="label">${esc(label)}</td><td class="value">${esc(String(value))}</td></tr>`;
}

function fmt(n: number): string {
  return formatNumber(Math.round(n * 100) / 100);
}

// ─── Section builder ──────────────────────────────────────────────────────────

function section(title: string, body: string): string {
  return `
    <section>
      <h2>${esc(title)}</h2>
      ${body}
    </section>`;
}

function table(head: string, body: string): string {
  return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

// ─── Individual sections ──────────────────────────────────────────────────────

function buildOrderInfo(order: WorkOrder, t: PdfStrings): string {
  const processLabels = (order.processes ?? []).map((p) => {
    if (p === 'PRINT') return t.print;
    if (p === 'EMBROIDERY') return t.embroidery;
    if (p === 'WASH') return t.wash;
    return p;
  });

  const body = `<table class="info-grid">
    ${row2(t.workOrderNumber, order.workOrderNumber)}
    ${row2(t.client, order.client)}
    ${row2(t.modelName, order.modelName)}
    ${row2(t.garmentType, order.garmentType)}
    ${row2(t.clientStyle, order.clientStyle)}
    ${row2(t.ourStyle, order.ourStyle)}
    ${row2(t.startDate, order.startDate ? formatDate(order.startDate) : '')}
    ${order.modelTimeMinutes ? row2(t.modelTime, `${formatNumber(order.modelTimeMinutes)} ${t.minutes}`) : ''}
    ${processLabels.length ? row2(t.processes, processLabels.join(', ')) : ''}
  </table>`;
  return section(t.orderInfo, body);
}

function buildPos(order: WorkOrder, t: PdfStrings): string {
  if (!order.pos?.length) return '';
  const totalQty = order.pos.reduce((sum, po) => sum + (po.quantity || 0), 0);
  const head = `<tr>
    <th>${esc(t.poNumber)}</th>
    <th class="num">${esc(t.poQty)}</th>
    <th>${esc(t.poDelivery)}</th>
  </tr>`;
  const rows = order.pos.map(
    (po) => `<tr>
      <td class="bold">${esc(po.poNumber || '—')}</td>
      <td class="num">${esc(formatNumber(po.quantity || 0))}</td>
      <td>${esc(po.deliveryDate ? formatDate(po.deliveryDate) : '—')}</td>
    </tr>`,
  );
  rows.push(`<tr class="total-row">
    <td>${esc(t.poTotal)}</td>
    <td class="num">${esc(formatNumber(totalQty))}</td>
    <td></td>
  </tr>`);
  return section(t.pos, table(head, rows.join('')));
}

function buildFabrics(order: WorkOrder, t: PdfStrings, dir: 'rtl' | 'ltr'): string {
  if (!order.fabrics?.length) return '';
  const head = `<tr>
    <th>${esc(t.fabricName)}</th>
    <th class="num" style="width: 140px;">${esc(t.consumption)}</th>
  </tr>`;
  const rows = order.fabrics.map((f) => {
    const parts: string[] = [];
    if (f.name?.trim()) parts.push(f.name.trim());
    if (f.composition?.trim()) parts.push(f.composition.trim());

    // GSM (اكسبريشن ثابت قبل النمرة)
    if (f.weightGsm) {
      parts.push(`${formatNumber(f.weightGsm)} GSM`);
    } else {
      parts.push('GSM');
    }

    // النمرة
    if (f.yarnCount?.trim()) parts.push(f.yarnCount.trim());

    const fabricLine = parts.join(' ') || '—';
    const consumptionText = f.consumptionPerPiece
      ? `${f.consumptionPerPiece.toFixed(3)} ${esc(f.consumptionUnit || 'kg')}`
      : '—';

    return `<tr>
      <td class="bold" dir="${dir}" style="text-align: ${dir === 'rtl' ? 'right' : 'left'}; unicode-bidi: embed;">${esc(fabricLine)}</td>
      <td class="num bold">${esc(consumptionText)}</td>
    </tr>`;
  });
  return section(t.fabrics, table(head, rows.join('')));
}

function buildSizes(order: WorkOrder, t: PdfStrings): string {
  if (!order.sizes?.length) return '';
  const chips = order.sizes.map((s) => `<span class="chip">${esc(s)}</span>`).join(' ');
  return section(t.sizes, `<div class="chips">${chips}</div>`);
}

function buildColors(order: WorkOrder, t: PdfStrings): string {
  if (!order.colors?.length) return '';
  const hasExtra = order.colors.some((c) => (c.extraPercent || 0) > 0);

  const head = `<tr>
    <th>${esc(t.color)}</th>
    ${order.sizes.map((s) => `<th class="num">${esc(s)}</th>`).join('')}
    <th class="num">${esc(t.totalRatio)}</th>
    <th class="num">${esc(t.quantity)}</th>
    ${hasExtra ? `<th class="num">${esc(t.extra)}</th><th class="num">${esc(t.toCut)}</th>` : ''}
  </tr>`;

  const plans = order.colors.map((c) => planColor(c, order.sizes));

  const rows = order.colors.map((color, i) => {
    const plan = plans[i];
    const ratioSum = order.sizes.reduce((sum, s) => sum + (color.ratio[s] ?? 0), 0);
    return `<tr>
      <td class="bold">${esc(color.name || '—')}</td>
      ${order.sizes.map((s) => `<td class="num">${esc(formatNumber(color.ratio[s] ?? 0))}</td>`).join('')}
      <td class="num">${esc(formatNumber(ratioSum))}</td>
      <td class="num">${esc(formatNumber(color.orderQuantity || 0))}</td>
      ${hasExtra ? `<td class="num">${esc(color.extraPercent > 0 ? color.extraPercent + '%' : '—')}</td><td class="num bold">${esc(formatNumber(plan.cutPieces))}</td>` : ''}
    </tr>`;
  });
  return section(t.colors, table(head, rows.join('')));
}

function fabricLabel(f: { name: string; kind: string }, t: PdfStrings): string {
  if (f.name?.trim()) return f.name.trim();
  return { MAIN: t.kindMain, RIB: t.kindRib, AUXILIARY: t.kindAux, OTHER: t.kindOther }[f.kind] ?? f.kind;
}

function buildCutting(order: WorkOrder, t: PdfStrings): string {
  if (!order.colors?.length) return '';
  const plans = order.colors.map((c) => planColor(c, order.sizes));
  const totals = calculateWorkOrderTotals(order);
  // One quantity column per fabric that has a consumption.
  const fabrics = (order.fabrics ?? []).filter((f) => (f.consumptionPerPiece ?? 0) > 0);

  const head = `<tr>
    <th>${esc(t.color)}</th>
    ${order.sizes.map((s) => `<th class="num">${esc(s)}</th>`).join('')}
    <th class="num">${esc(t.cutTotalPieces)}</th>
    ${fabrics.map((f) => `<th class="num">${esc(fabricLabel(f, t))} (${esc(f.consumptionUnit || 'kg')})</th>`).join('')}
  </tr>`;

  const rows = order.colors.map((color, i) => {
    const plan = plans[i];
    return `<tr>
      <td class="bold">${esc(color.name || '—')}</td>
      ${order.sizes.map((s) => `<td class="num bold">${esc(formatNumber(plan.cutPerSize[s] ?? 0))}</td>`).join('')}
      <td class="num bold">${esc(formatNumber(plan.cutPieces))}</td>
      ${fabrics
        .map((f) => {
          const own = f.kind !== 'MAIN' ? fabricColorOf(color, f) : '';
          return `<td class="num bold">${fmt(plan.cutPieces * (f.consumptionPerPiece ?? 0))}${own ? `<div style="font-weight:400;font-size:8.5pt">${esc(own)}</div>` : ''}</td>`;
        })
        .join('')}
    </tr>`;
  });

  const totalRow = `<tr class="total-row">
    <td>${esc(t.totalRow)}</td>
    ${order.sizes.map((s) => `<td class="num bold">${esc(formatNumber(totals.cutPerSize[s] ?? 0))}</td>`).join('')}
    <td class="num bold">${esc(formatNumber(totals.cutPieces))}</td>
    ${fabrics.map((f) => `<td class="num bold">${fmt(totals.cutPieces * (f.consumptionPerPiece ?? 0))}</td>`).join('')}
  </tr>`;

  const summary = `<div class="summary-line">
    <span>${esc(t.toCut)}: <strong>${formatNumber(totals.cutPieces)} ${t.pcs}</strong></span>
  </div>`;

  return section(t.cuttingQty, table(head, rows.join('') + totalRow) + summary);
}

function buildFabricByColor(order: WorkOrder, t: PdfStrings): string {
  const items = fabricRequirements(order);
  if (!items.length) return '';
  const head = `<tr><th>${esc(t.fabricName)}</th><th>${esc(t.fabricColor)}</th><th class="num">${esc(t.quantity)}</th></tr>`;
  const rows = items
    .map(
      (x) => `<tr>
      <td>${esc(fabricLabel(x.fabric, t))}</td>
      <td>${esc(x.color)}</td>
      <td class="num bold">${esc(formatNumber(x.quantity))} ${esc(x.fabric.consumptionUnit || 'kg')}</td>
    </tr>`,
    )
    .join('');
  return section(t.fabricByColor, table(head, rows));
}

function buildMeasures(order: WorkOrder, t: PdfStrings): string {
  const rows = order.measurements ?? [];
  if (!rows.length) return '';
  const head = `<tr><th></th><th>${esc(t.measureName)}</th><th>${esc(t.measureFrom)}</th><th>${esc(t.measureTo)}</th>${order.sizes
    .map((s) => `<th class="num">${esc(s)}</th>`)
    .join('')}</tr>`;
  const body = rows
    .map(
      (m) => `<tr>
      <td class="bold">${esc(m.code)}</td><td>${esc(m.name)}</td><td>${esc(m.measureFrom)}</td><td>${esc(m.measureTo)}</td>
      ${order.sizes.map((s) => `<td class="num">${esc(m.values[s] ?? '')}</td>`).join('')}
    </tr>`,
    )
    .join('');
  return section(t.measures, table(head, body));
}

function buildAccessories(order: WorkOrder, t: PdfStrings): string {
  const list = order.accessories ?? [];
  if (!list.length) return '';
  const totals = calculateWorkOrderTotals(order);
  const source = { LOCAL: t.srcLocal, IMPORTED: t.srcImported, NOMINATED: t.srcNominated };
  const head = `<tr><th></th><th>${esc(t.accessory)}</th><th>${esc(t.accSpec)}</th><th>${esc(t.accSource)}</th><th class="num">${esc(t.accRatio)}</th><th class="num">${esc(t.accTotal)}</th></tr>`;
  const body = list
    .map((a) => {
      const r = calculateAccessory(a, totals, order.sizes);
      const perSize = a.bySize
        ? `<div style="font-size:8.5pt">${order.sizes
            .map((s) => `${esc(s)}${a.specsBySize?.[s] ? ` (${esc(a.specsBySize[s])})` : ''}: ${esc(formatNumber(r.perSize[s] ?? 0))}`)
            .join(' | ')}</div>`
        : '';
      return `<tr>
      <td>${esc(a.section === 'PACKING' ? t.accPacking : t.accOperation)}</td>
      <td class="bold">${esc(a.name)}</td>
      <td>${esc(a.spec)}${perSize}</td>
      <td>${esc(source[a.source])}</td>
      <td class="num">${esc(a.accessoryQty)} : ${esc(a.garmentQty)}</td>
      <td class="num bold">${esc(formatNumber(r.total))} ${esc(a.unit)}</td>
    </tr>`;
    })
    .join('');
  return section(t.accessories, table(head, body));
}

function buildImage(order: WorkOrder, t: PdfStrings): string {
  if (!order.imageUrl) return '';
  return section(t.modelImage, `<div class="model-image"><img src="${esc(order.imageUrl)}" alt="${esc(order.modelName)}" /></div>`);
}

function buildNotes(order: WorkOrder, t: PdfStrings): string {
  if (!order.notes?.trim()) return '';
  return section(t.notes, `<p class="notes-text">${esc(order.notes)}</p>`);
}

function buildSignOff(order: WorkOrder, t: PdfStrings): string {
  const { preparedBy, reviewedBy, approvedBy } = order.signOff ?? {};
  return section(
    t.signOff,
    `<div class="signoff-grid">
      <div class="signoff-box">
        <div class="signoff-label">${esc(t.preparedBy)}</div>
        <div class="signoff-name">${esc(preparedBy || '')}</div>
        <div class="signoff-line"></div>
      </div>
      <div class="signoff-box">
        <div class="signoff-label">${esc(t.reviewedBy)}</div>
        <div class="signoff-name">${esc(reviewedBy || '')}</div>
        <div class="signoff-line"></div>
      </div>
      <div class="signoff-box">
        <div class="signoff-label">${esc(t.approvedBy)}</div>
        <div class="signoff-name">${esc(approvedBy || '')}</div>
        <div class="signoff-line"></div>
      </div>
    </div>`,
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

function buildStyles(dir: 'rtl' | 'ltr'): string {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${dir === 'rtl'
      ? '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif'
      : '"IBM Plex Sans", "Segoe UI", Tahoma, Arial, sans-serif'};
      font-size: 11pt;
      color: #18212F;
      direction: ${dir};
      background: #fff;
    }
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 12px;
      border-bottom: 3px solid #1B2A41;
      margin-bottom: 20px;
      background: #1B2A41;
      color: #fff;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { height: 40px; width: auto; }
    .brand-name { font-size: 18pt; font-weight: 700; letter-spacing: -0.01em; color: #fff; }
    .brand-sub { font-size: 9pt; color: #D9962B; font-weight: 600; }
    .doc-meta { text-align: ${dir === 'rtl' ? 'left' : 'right'}; }
    .doc-number { font-size: 15pt; font-weight: 700; color: #fff; }
    .doc-date { font-size: 9pt; color: #aaa; margin-top: 2px; }
    .doc-body { padding: 0 24px 24px; }
    section {
      margin-bottom: 20px;
      border: 1px solid #DCE1E8;
      border-radius: 6px;
      overflow: hidden;
      break-inside: avoid;
    }
    h2 {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 7px 12px;
      background: #F2F4F7;
      border-bottom: 1px solid #DCE1E8;
      color: #1B2A41;
    }
    .info-grid { width: 100%; border-collapse: collapse; }
    .info-grid td { padding: 5px 12px; border-bottom: 1px solid #E8ECF1; vertical-align: top; }
    .info-grid td.label { width: 38%; font-weight: 600; color: #586377; white-space: nowrap; }
    .info-grid td.value { font-weight: 500; }
    .info-grid tr:last-child td { border-bottom: 0; }
    .table-wrap { overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    thead tr { background: #F7F8FA; }
    th {
      padding: 6px 10px;
      text-align: ${dir === 'rtl' ? 'right' : 'left'};
      font-size: 9pt;
      font-weight: 600;
      color: #586377;
      border-bottom: 1px solid #DCE1E8;
      white-space: nowrap;
    }
    td {
      padding: 5px 10px;
      border-bottom: 1px solid #E8ECF1;
      vertical-align: middle;
    }
    td.bold, .bold { font-weight: 600; }
    th.num, td.num { text-align: center; }
    .total-row td {
      font-weight: 700;
      border-top: 2px dashed #D9962B88;
      border-bottom: 0;
      background: rgba(27,42,65,0.03);
    }
    .sub { font-size: 8pt; color: #8993A4; margin-top: 1px; }
    .chips { padding: 10px 12px; display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      background: #EDF0F5;
      border: 1px solid #DCE1E8;
      border-radius: 4px;
      padding: 2px 10px;
      font-size: 10pt;
      font-weight: 600;
    }
    .summary-line {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      padding: 8px 12px;
      background: #F7F8FA;
      border-top: 1px solid #DCE1E8;
      font-size: 10pt;
      color: #586377;
    }
    .summary-line strong { color: #18212F; }
    .model-image { padding: 12px; display: flex; justify-content: center; }
    .model-image img { max-width: 100%; max-height: 240px; object-fit: contain; border-radius: 4px; }
    .notes-text { padding: 10px 12px; white-space: pre-wrap; font-size: 10pt; }
    .signoff-grid {
      display: flex;
      gap: 0;
      padding: 12px;
    }
    .signoff-box {
      flex: 1;
      padding: 8px 16px;
      border-${dir === 'rtl' ? 'left' : 'right'}: 1px solid #E8ECF1;
      text-align: center;
    }
    .signoff-box:last-child { border: 0; }
    .signoff-label { font-size: 9pt; color: #586377; font-weight: 600; margin-bottom: 4px; }
    .signoff-name { font-size: 11pt; font-weight: 600; min-height: 20px; }
    .signoff-line {
      border-bottom: 1.5px solid #1B2A41;
      margin-top: 24px;
      margin-${dir === 'rtl' ? 'right' : 'left'}: 8px;
      margin-${dir === 'rtl' ? 'left' : 'right'}: 8px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      section { break-inside: avoid; }
      .doc-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    .print-btn-bar {
      position: fixed;
      top: 12px;
      ${dir === 'rtl' ? 'left' : 'right'}: 16px;
      display: flex;
      gap: 8px;
      z-index: 999;
    }
    .print-btn {
      background: #1B2A41;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 10pt;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .print-btn:hover { background: #243650; }
  `;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function printWorkOrder(order: WorkOrder, locale: Locale = 'en'): void {
  const t = STRINGS[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const docTitle = t.docTitle(order.workOrderNumber || (locale === 'ar' ? 'جديد' : 'New'));
  const printedAt = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Logo: use public/logo.jpg (available at /logo.jpg in the served app)
  const logoHtml = `<img src="/logo.jpg" alt="logo" onerror="this.style.display='none'" />`;

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${esc(docTitle)}</title>
  <style>${buildStyles(dir)}</style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <button class="print-btn" onclick="window.print()">${esc(t.printBtn)}</button>
    <button class="print-btn" style="background:#586377" onclick="window.close()">${esc(t.closeBtn)}</button>
  </div>

  <header class="doc-header">
    <div class="brand">
      ${logoHtml}
      <div>
        <div class="brand-name">${esc(t.brand)}</div>
        <div class="brand-sub">Production</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-number">${esc(docTitle)}</div>
      <div class="doc-date">${esc(printedAt)}</div>
    </div>
  </header>

  <div class="doc-body">
    ${buildOrderInfo(order, t)}
    ${buildPos(order, t)}
    ${buildFabrics(order, t, dir)}
    ${buildSizes(order, t)}
    ${buildColors(order, t)}
    ${buildCutting(order, t)}
    ${buildFabricByColor(order, t)}
    ${buildMeasures(order, t)}
    ${buildAccessories(order, t)}
    ${buildImage(order, t)}
    ${buildNotes(order, t)}
    ${buildSignOff(order, t)}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 300);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=800,scrollbars=yes');
  if (!win) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
