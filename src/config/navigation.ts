import {
  ArrowDownUp,
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Scissors,
  Settings,
  Shirt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  labelAr: string;
  path: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  { label: 'Dashboard', labelAr: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', labelAr: 'العملاء', path: '/clients', icon: Users },
  {
    label: 'Production',
    labelAr: 'الإنتاج',
    path: '/production',
    icon: Factory,
    children: [
      { label: 'Orders', labelAr: 'أوامر التشغيل', path: '/production/orders', icon: ClipboardList },
      { label: 'Cutting', labelAr: 'القص', path: '/production/cutting', icon: Scissors },
      { label: 'Sorting', labelAr: 'الفرز والترقيم', path: '/production/sorting', icon: ArrowDownUp },
      { label: 'Sewing', labelAr: 'الخياطة والتجميع', path: '/production/sewing', icon: Shirt },
      { label: 'QC', labelAr: 'فحص الجودة', path: '/production/qc', icon: ShieldCheck },
    ],
  },
  { label: 'Inventory', labelAr: 'المخازن', path: '/inventory', icon: Boxes },
  { label: 'Reports', labelAr: 'التقارير', path: '/reports', icon: BarChart3 },
  { label: 'Settings', labelAr: 'الإعدادات', path: '/settings', icon: Settings },
];
