import type { FabricUnit, SizeCode } from '../types/production';

export const SIZE_CODES: readonly SizeCode[] = ['S', 'M', 'L', 'XL', 'XXL'];

export const FABRIC_UNITS: readonly { value: FabricUnit; label: string }[] = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'yd', label: 'Yards (yd)' },
];
