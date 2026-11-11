import {
  ArrowDownUp,
  Boxes,
  CheckCircle2,
  Clock,
  Scissors,
  Shirt,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ProductionStatus } from '../types/production';

export const statusIcons: Record<ProductionStatus, LucideIcon> = {
  PENDING: Clock,
  CUTTING: Scissors,
  SORTING: ArrowDownUp,
  SEWING: Shirt,
  QUALITY_CHECK: ShieldCheck,
  INVENTORY: Boxes,
  COMPLETED: CheckCircle2,
};
