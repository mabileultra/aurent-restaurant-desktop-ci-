import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';
import { usePersistedRestaurantStoreId } from './usePersistedRestaurantStoreId';
import { resolveRestaurantPickableStores } from '../utils/resolveRestaurantPickableStores';

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
  const pickableStores = useMemo(
    () => resolveRestaurantPickableStores({
      restaurantStores,
      assignedIds,
      staffUsesAssignment,
      staffPool,
    }),
    [restaurantStores, assignedIds, staffUsesAssignment, staffPool],
  );
  // Single JWT assignment is enough to open floor/menu/admin — do not block on store list.
  const soleAssignedId = assignedIds.length === 1 ? assignedIds[0] : null;
  const storesLoading = soleAssignedId != null
    ? false
    : (staffUsesAssignment ? (cashier.storeLoading || isLoading) : isLoading);

  const effectiveStoreId = useMemo(() => {
    const picked = Number(pickedStoreId);
    const pickedId = Number.isFinite(picked) && picked > 0 ? picked : null;
    const pickedInList = pickedId != null && pickableStores.some((s) => Number(s.id) === pickedId);
    const pickedInAssignment = pickedId != null
      && (assignedIds.length === 0 || assignedIds.includes(pickedId));

    // One assigned branch: start POS/admin queries immediately from JWT.
    if (soleAssignedId != null) return soleAssignedId;

    // Optimistic last branch only when it cannot belong to another company/user.
    if (storesLoading && pickedId != null && pickedInAssignment) return pickedId;
    if (pickedInList) return pickedId;
    if (staffUsesAssignment) {
      if (staffPool.length === 1) return Number(staffPool[0].id);
      if (cashier.storeId != null && staffPool.some((s) => Number(s.id) === Number(cashier.storeId))) {
        return Number(cashier.storeId);
      }
      return null;
    }
    if (restaurantStores.length === 1) return Number(restaurantStores[0].id);
    return null;
  }, [
    soleAssignedId,
    storesLoading,
    pickedStoreId,
    pickableStores,
    assignedIds,
    staffUsesAssignment,
    staffPool,
    cashier.storeId,
    restaurantStores,
  ]);

  useEffect(() => {
    if (storesLoading) return;
    if (effectiveStoreId != null) {
      if (String(pickedStoreId) !== String(effectiveStoreId)) {
        setPickedStoreId(String(effectiveStoreId));
      }
      return;
    }
    if (pickedStoreId && pickableStores.length > 0) setPickedStoreId('');
  }, [storesLoading, effectiveStoreId, pickedStoreId, pickableStores.length, setPickedStoreId]);

  const storeName = useMemo(() => {
    const match = pickableStores.find((s) => Number(s.id) === Number(effectiveStoreId));
    if (match?.name) return match.name;
    if (staffUsesAssignment && Number(cashier.storeId) === Number(effectiveStoreId)) {
      return cashier.storeName;
    }
    return null;
  }, [pickableStores, effectiveStoreId, staffUsesAssignment, cashier.storeId, cashier.storeName]);

  // Admin: empty /stores alone is not "no assignment" if JWT already has storeIds (edge offline).
  const noCompanyRestaurants = !isLoading
    && restaurantStores.length === 0
    && assignedIds.length === 0
    && !staffUsesAssignment;
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
    isLoading: storesLoading,
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
