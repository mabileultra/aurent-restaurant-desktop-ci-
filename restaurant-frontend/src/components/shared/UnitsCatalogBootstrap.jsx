import { useUnitsCatalog } from '../../hooks/useUnitsCatalog';

/** Prefetches unit catalog after auth so product forms get real unit codes. */
export default function UnitsCatalogBootstrap({ children }) {
  useUnitsCatalog();
  return children;
}
