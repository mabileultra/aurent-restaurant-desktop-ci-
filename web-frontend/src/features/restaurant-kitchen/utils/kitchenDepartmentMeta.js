import { Ban, Beef, Cake, ChefHat, Flame, Snowflake, Wine } from 'lucide-react';

const DEPARTMENT_META = {
  NONE: { tone: 'emerald', icon: Ban },
  HOT: { tone: 'amber', icon: Flame },
  COLD: { tone: 'blue', icon: Snowflake },
  BAR: { tone: 'violet', icon: Wine },
  GRILL: { tone: 'yellow', icon: Beef },
  PASTRY: { tone: 'teal', icon: Cake },
  GENERAL: { tone: 'slate', icon: ChefHat },
};

export function resolveDepartmentMeta(value) {
  const key = String(value ?? 'GENERAL').toUpperCase();
  return DEPARTMENT_META[key] ?? { tone: 'slate', icon: ChefHat };
}
