import { useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';
import { usePersistedRestaurantStoreId } from './usePersistedRestaurantStoreId';

/**
 * Resolves which restaurant/canteen branch the current user works in.
 * Floor staff: assigned storeIds (or pick among several).
 * Admin/manager: company restaurant stores (auto if one, else pick).
 */
export function useRestaurantWorkspaceStore() {
  const user = useAuthStore((s) => s.user);
  const cashier = useCashierStore();
  const { restaurantStores, isLoading } = useRestaurantStores();
  const [pickedStoreId, setPickedStoreId] = usePersistedRestaurantStoreId();

  const role = user?.role;
  const isFloorStaff = role === 'CASHIER' || role === 'WAITER';
  const isCook = role === 'COOK';
  const assignedIds = useMemo(
    () => (user?.storeIds || []).map(Number).filter((id) => Number.isFinite(id)),
    [user?.storeIds],
  );

  const assignedRestaurantStores = useMemo(() => {
    if (!assignedIds.length) return [];
    const byId = new Set(assignedIds);
    return restaurantStores.filter((s) => byId.has(Number(s.id)));
  }, [assignedIds, restaurantStores]);

  const staffPool = useMemo(() => {
    if (!(isFloorStaff || isCook)) return [];
    if (assignedRestaurantStores.length) return assignedRestaurantStores;
    if (assignedIds.length === 1 && restaurantStores.length) {
      const one = restaurantStores.find((s) => Number(s.id) === assignedIds[0]);
      return one ? [one] : [];
    }
    return assignedRestaurantStores;
  }, [isFloorStaff, isCook, assignedRestaurantStores, assignedIds, restaurantStores]);

  const staffUsesAssignment = isFloorStaff || isCook;
  const pickableStores = staffUsesAssignment ? staffPool : restaurantStores;

  const effectiveStoreId = useMemo(() => {
    if (pickedStoreId) {
      const id = Number(pickedStoreId);
      if (pickableStores.some((s) => Number(s.id) === id)) return id;
    }
    if (staffUsesAssignment) {
      if (staffPool.length === 1) return Number(staffPool[0].id);
      if (cashier.storeId != null && staffPool.some((s) => Number(s.id) === Number(cashier.storeId))) {
        return Number(cashier.storeId);
      }
      return null;
    }
    if (restaurantStores.length === 1) return Number(restaurantStores[0].id);
    return null;
  }, [pickedStoreId, pickableStores, staffUsesAssignment, staffPool, cashier.storeId, restaurantStores]);

  const storeName = useMemo(() => {
    const match = pickableStores.find((s) => Number(s.id) === Number(effectiveStoreId));
    if (match?.name) return match.name;
    if (staffUsesAssignment && Number(cashier.storeId) === Number(effectiveStoreId)) {
      return cashier.storeName;
    }
    return null;
  }, [pickableStores, effectiveStoreId, staffUsesAssignment, cashier.storeId, cashier.storeName]);

  const noCompanyRestaurants = !isLoading && restaurantStores.length === 0;
  const noStaffStores = staffUsesAssignment && !isLoading && staffPool.length === 0 && assignedIds.length === 0;
  const staffStoresWrongType = staffUsesAssignment
    && !isLoading
    && assignedIds.length > 0
    && staffPool.length === 0;

  const needsPick = effectiveStoreId == null
    && pickableStores.length > 1;

  return {
    storeId: effectiveStoreId,
    storeName,
    restaurantStores: pickableStores,
    allRestaurantStores: restaurantStores,
    isLoading: staffUsesAssignment ? (cashier.storeLoading || isLoading) : isLoading,
    noAssignment: noCompanyRestaurants || noStaffStores || staffStoresWrongType,
    noCompanyRestaurants,
    noStaffStores,
    staffStoresWrongType,
    multipleAssignment: needsPick,
    canPickStore: pickableStores.length > 1,
    pickedStoreId: pickedStoreId || (effectiveStoreId != null ? String(effectiveStoreId) : ''),
    setPickedStoreId,
    isFloorStaff,
  };
}
