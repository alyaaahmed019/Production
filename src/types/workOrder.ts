/**
 * Work order (أمر التشغيل) — the full "model card" that Customer Service fills in.
 * It is separate from the older `ProductionOrder` type so the existing screens keep working
 * while the new screens are built one by one.
 */

export type FabricUnit = 'kg' | 'm' | 'yd';

/** Work done outside the sewing line. Chosen when the order is created, tracked later by count. */
export type ExternalProcess = 'PRINT' | 'EMBROIDERY' | 'WASH';

export type FabricKind = 'MAIN' | 'RIB' | 'AUXILIARY' | 'OTHER';

/** A size label such as "1", "12", "S" or "XXL". The list of sizes is defined per order. */
export type SizeLabel = string;

/** One client PO inside the work order. Each PO has its own quantity and delivery date. */
export interface PoLine {
  id: string;
  poNumber: string;
  quantity: number;
  deliveryDate: string; // YYYY-MM-DD
}

export interface FabricSpec {
  id: string;
  kind: FabricKind;
  /** Free text, e.g. "براسولا" or "ريب ليكرا". */
  name: string;
  weightGsm?: number;
  /** Yarn count as written on the sheet, e.g. "40/1". */
  yarnCount?: string;
  combed: boolean;
  /** Fabric content as written on the sheet, e.g. "100% C". */
  composition?: string;
  consumptionPerPiece?: number;
  consumptionUnit: FabricUnit;
}

export interface ColorLine {
  id: string;
  name: string;
  /** Pieces per size in one bag, e.g. { XS: 1, S: 2, L: 1 } -> 4 pieces per bag. */
  ratio: Record<SizeLabel, number>;
  /** Pieces ordered for this color. Must be a whole number of bags. */
  orderQuantity: number;
  /** Extra percentage added on top of the order quantity. Differs per color. */
  extraPercent: number;
  /**
   * Color of the rib / auxiliary / other fabrics for THIS color, keyed by fabric id.
   * A missing key means "same color as the main fabric" (the color name).
   */
  fabricColors?: Record<string, string>;
}

export interface MeasurementRow {
  id: string;
  /** Point letter on the sheet: A, B, C ... */
  code: string;
  name: string;
  measureFrom: string;
  measureTo: string;
  /** Value per size, as typed (e.g. "52" or "52.5"). A missing key means "not set". */
  values: Partial<Record<SizeLabel, string>>;
}

export interface PackingSpec {
  singleColorPerCarton: boolean;
  singleSizePerCarton: boolean;
  piecesPerCarton?: number;
  maxCartonWeightKg?: number;
  /** One poly bag per N garment pieces (the sheet shows 1 bag for 2 pieces). */
  polyBagPerPieces?: number;
}

/** Where an accessory goes on the garment, and how many accessories per how many garments. */
export interface AccessoryPlacement {
  id: string;
  accessory: string;
  accessoryQty: number;
  garmentQty: number;
  location: string;
}

export type AccessorySection = 'OPERATION' | 'PACKING';
export type AccessoryUnit = 'PC' | 'm' | 'kg' | 'roll';
export type AccessorySource = 'LOCAL' | 'IMPORTED' | 'NOMINATED';
/** Is the accessory quantity calculated from the ordered pieces or from the cut pieces (with extra)? */
export type AccessoryBasis = 'ORDER' | 'CUT';

/** An operation or packing accessory: "accessoryQty accessories for every garmentQty garments". */
export interface AccessoryLine {
  id: string;
  section: AccessorySection;
  name: string;
  spec: string;
  unit: AccessoryUnit;
  source: AccessorySource;
  accessoryQty: number;
  garmentQty: number;
  basis: AccessoryBasis;
  /** When true the quantity is also split per size and each size can have its own spec. */
  bySize: boolean;
  specsBySize: Record<SizeLabel, string>;
}

export interface SignOff {
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
}

export interface WorkOrder {
  id: string;
  /** رقم التشغيل — the factory's own number for the order (5010 on the sheet). Unique. */
  workOrderNumber: string;
  client: string;
  /** Men's, women's, kids... free text. */
  garmentType: string;
  modelName: string;
  clientStyle: string;
  ourStyle: string;
  startDate: string; // YYYY-MM-DD
  /** The sizes used by this order, in display order. */
  sizes: SizeLabel[];
  pos: PoLine[];
  fabrics: FabricSpec[];
  /** Standard minutes for one piece (زمن الموديل). */
  modelTimeMinutes?: number;
  processes: ExternalProcess[];
  colors: ColorLine[];
  measurements: MeasurementRow[];
  packing: PackingSpec;
  mainLabelName: string;
  accessoryPlacements: AccessoryPlacement[];
  /** Operation and packing accessories. Missing on orders saved before this field existed. */
  accessories?: AccessoryLine[];
  notes: string;
  /** Key of the model image stored on the device (and later in Drive). */
  imageId?: string;
  /** Image data URL (base64) or remote URL for model display. */
  imageUrl?: string;
  signOff: SignOff;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  createdBy: string;
  updatedBy: string;
}

/** What the form sends to the service. Identity and audit fields are set by the service. */
export type WorkOrderInput = Omit<
  WorkOrder,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export type SyncStatus = 'synced' | 'pending';

export interface WorkOrderListItem extends WorkOrder {
  syncStatus: SyncStatus;
}
