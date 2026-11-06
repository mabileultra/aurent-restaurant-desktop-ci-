import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { useCashierStoreProfile } from '../../../hooks/useCashierStoreProfile';
import { isLegacyGroceryDesktop } from '../../../utils/isLegacyGroceryDesktop';
import { isPharmacyBusinessType } from '../../../utils/isPharmacyBusinessType';
import PharmacyDesktopForceUpdateModal from './PharmacyDesktopForceUpdateModal';

/** Блокирует старый grocery-desktop для аптечных компаний. */
export default function PharmacyLegacyDesktopForceGate() {
  const { businessType } = useCompanyBusinessType();
  const { isPharmacy } = useCashierStoreProfile();
  const pharmacyTenant = isPharmacy || isPharmacyBusinessType(businessType);
  const open = isLegacyGroceryDesktop() && pharmacyTenant;
  return <PharmacyDesktopForceUpdateModal open={open} />;
}
