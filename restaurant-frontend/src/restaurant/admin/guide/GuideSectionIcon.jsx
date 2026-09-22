import {
  CalendarDays,
  ChefHat,
  ClipboardList,
  Clock,
  CreditCard,
  LayoutGrid,
  Library,
  ListOrdered,
  ShieldCheck,
  Sun,
  Users,
  UtensilsCrossed,
  Warehouse,
} from 'lucide-react';

const ICONS = {
  ListOrdered,
  ShieldCheck,
  Users,
  LayoutGrid,
  UtensilsCrossed,
  Library,
  Warehouse,
  ClipboardList,
  CreditCard,
  ChefHat,
  Clock,
  CalendarDays,
  Sun,
};

export default function GuideSectionIcon({ name, size = 18 }) {
  const Icon = ICONS[name] || ListOrdered;
  return <Icon size={size} strokeWidth={2.15} aria-hidden />;
}
