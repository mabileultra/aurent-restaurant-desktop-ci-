import { useEffect, useState } from 'react';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';

/** Default stock report store filter to the admin workspace store (offline + online). */
export function useWorkspaceBoundStoreFilter(resetPage) {
  const workspace = useRestaurantWorkspaceStore();
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    if (workspace.storeId != null) {
      setStoreId(String(workspace.storeId));
    }
  }, [workspace.storeId]);

  const handleStoreChange = (value) => {
    setStoreId(value);
    if (typeof resetPage === 'function') resetPage();
  };

  return { storeId, setStoreId, handleStoreChange, workspace };
}
