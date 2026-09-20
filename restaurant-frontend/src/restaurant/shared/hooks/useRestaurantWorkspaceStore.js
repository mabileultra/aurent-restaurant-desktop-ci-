import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';

export function useRestaurantWorkspaceStore() {
  const user = useAuthStore((s) => s.user);
  const cashier = useCashierStore();
  const { restaurantStores, isLoading } = useRestaurantStores();
  const [pickedStoreId, setPickedStoreId] = useState('');

  const isFloorStaff = user?.role === 'CASHIER' || user?.role === 'WAITER';
  const cookUsesCashierStore = user?.role === 'COOK' && cashier.storeId != null;

  const effectiveStoreId = useMemo(() => {
    if (isFloorStaff || cookUsesCashierStore) return cashier.storeId;
    if (pickedStoreId) return Number(pickedStoreId);
    if (restaurantStores.length === 1) return restaurantStores[0].id;
    return null;
  }, [isFloorStaff, cookUsesCashierStore, cashier.storeId, pickedStoreId, restaurantStores]);

  const storeName = useMemo(() => {
    if (isFloorStaff || cookUsesCashierStore) return cashier.storeName;
    const match = restaurantStores.find((store) => store.id === effectiveStoreId);
    return match?.name ?? null;
  }, [isFloorStaff, cookUsesCashierStore, cashier.storeName, restaurantStores, effectiveStoreId]);

  const staffWorkspace = isFloorStaff || cookUsesCashierStore;

  return {
    storeId: effectiveStoreId,
    storeName,
    restaurantStores,
    isLoading: staffWorkspace ? cashier.storeLoading : isLoading,
    noAssignment: staffWorkspace ? cashier.noAssignment : restaurantStores.length === 0,
    multipleAssignment: staffWorkspace ? cashier.multipleAssignment : restaurantStores.length > 1 && !pickedStoreId && !effectiveStoreId,
    canPickStore: !staffWorkspace && restaurantStores.length > 1,
    pickedStoreId: pickedStoreId || (effectiveStoreId != null ? String(effectiveStoreId) : ''),
    setPickedStoreId,
    isFloorStaff,
  };
}
