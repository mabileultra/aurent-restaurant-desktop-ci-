import toast from 'react-hot-toast';
import { isOrderOpenLike } from '../utils/floorPosDerivations';
import { isWeightSoldMenuItem } from '../utils/menuWeightSale';

/** Add / qty / remove / compose + foreign-table toast gate. */
export function useFloorOrderLineActions({
  t,
  access,
  order,
  activeOrderId,
  canMutateOrderLines,
  draftTableRef,
  addItemMutation,
  updateItemMutation,
  removeItemMutation,
  paintOptimisticAdd,
  aslMarkingEnabled,
  aslReady,
  resolveEnabled,
  compose,
}) {
  const {
    pendingMenuItem,
    setPendingMenuItem,
    setPendingVariants,
    setPendingWeightItem,
    selectedModifierIds,
    setSelectedModifierIds,
    pendingItemNote,
    setPendingItemNote,
    lineNoteEdit,
    setLineNoteEdit,
  } = compose;

  const toastForeignTableForbidden = () => {
    toast.error(t('rst.order.foreignTableForbidden', {
      defaultValue: 'Нельзя бить товар на чужой открытый стол',
    }));
  };

  const addItemNow = async (menuItem, extras = {}) => {
    if (!menuItem) return;
    if (activeOrderId && !canMutateOrderLines) {
      toastForeignTableForbidden();
      return;
    }
    if (menuItem.markedProduct) {
      const enabled = aslReady ? aslMarkingEnabled : await resolveEnabled();
      if (!enabled) {
        toast.error(t('rst.integrations.markingApiDisabled'));
        return;
      }
    }
    if (activeOrderId) {
      if (!isOrderOpenLike(order)) {
        toast.error(t('rst.order.notOpen', {
          defaultValue: 'Нельзя добавить блюдо в этот заказ',
        }));
        return;
      }
      addItemMutation.mutate({
        menuItem,
        modifierOptionIds: extras.modifierOptionIds ?? [],
        note: extras.note ?? '',
        quantity: extras.quantity,
      });
      return;
    }
    const patch = {
      modifierOptionIds: extras.modifierOptionIds ?? [],
      note: extras.note ?? '',
      quantity: extras.quantity,
    };
    paintOptimisticAdd(menuItem, patch);
  };

  const handleQty = (line, nextQty) => {
    if (!canMutateOrderLines) {
      toastForeignTableForbidden();
      return;
    }
    const isNew = line.itemStatus === 'NEW';
    const kitchen = line.itemStatus && line.itemStatus !== 'NEW' && line.itemStatus !== 'CANCELLED';
    const sent = Number(line.sentQuantity) || 0;
    const waiterPendingOk = kitchen && nextQty >= sent;
    if (!isNew && !(access.canCancelOrder && kitchen) && !waiterPendingOk) return;
    if (!isOrderOpenLike(order)) return;
    if (nextQty < 1) {
      removeItemMutation.mutate(line.id);
      return;
    }
    updateItemMutation.mutate({ itemId: line.id, quantity: nextQty });
  };

  const handleRemoveItem = (itemIdOrLine) => {
    if (!canMutateOrderLines) {
      toastForeignTableForbidden();
      return;
    }
    const line = itemIdOrLine && typeof itemIdOrLine === 'object'
      ? itemIdOrLine
      : (order?.items || []).find((row) => String(row.id) === String(itemIdOrLine));
    const itemId = line?.id ?? itemIdOrLine;
    if (itemId == null) return;
    removeItemMutation.mutate(itemId);
  };

  const handleAddItem = (menuItem) => {
    if (!menuItem) return;
    if (!activeOrderId && !draftTableRef.current) return;
    if (isWeightSoldMenuItem(menuItem)) {
      setPendingWeightItem(menuItem);
      return;
    }
    addItemNow(menuItem);
  };

  const handleComposeFamily = (family) => {
    if (!family) return;
    if (!activeOrderId && !draftTableRef.current) return;
    const variants = Array.isArray(family.variants) && family.variants.length
      ? family.variants
      : [family.primary].filter(Boolean);
    const primary = variants[0];
    if (!primary) return;
    if (family.multi && variants.length > 1) {
      if (isWeightSoldMenuItem(primary)) {
        setPendingWeightItem(primary);
        return;
      }
      setPendingVariants(variants);
      setPendingMenuItem(primary);
      setSelectedModifierIds([]);
      setPendingItemNote('');
      return;
    }
    handleAddItem(primary);
  };

  return {
    handleQty,
    handleRemoveItem,
    handleAddItem,
    handleComposeFamily,
    confirmWeightItem: ({ menuItem, quantity, note }) => addItemNow(menuItem, { quantity, note }),
    selectComposeVariant: (variant) => {
      if (!variant || variant.id === pendingMenuItem?.id) return;
      setPendingMenuItem(variant);
      setSelectedModifierIds([]);
    },
    toggleModifier: (optionId) => {
      setSelectedModifierIds((current) => (
        current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      ));
    },
    confirmModifiers: () => {
      if (!pendingMenuItem) return;
      addItemNow(pendingMenuItem, {
        modifierOptionIds: selectedModifierIds,
        note: pendingItemNote,
      });
    },
    closeWeightPick: () => setPendingWeightItem(null),
    closeModifiers: () => {
      setPendingMenuItem(null);
      setPendingVariants(null);
      setSelectedModifierIds([]);
      setPendingItemNote('');
    },
    openLineNote: (line) => {
      if (!canMutateOrderLines) {
        toastForeignTableForbidden();
        return;
      }
      setPendingMenuItem(null);
      setPendingVariants(null);
      setSelectedModifierIds([]);
      setPendingItemNote('');
      setLineNoteEdit({ id: line.id, name: line.name, note: line.note || '' });
    },
    saveLineNote: () => {
      if (!lineNoteEdit) return;
      if (!canMutateOrderLines) {
        toastForeignTableForbidden();
        return;
      }
      const line = order?.items?.find((row) => row.id === lineNoteEdit.id);
      if (!line) return;
      updateItemMutation.mutate(
        {
          itemId: lineNoteEdit.id,
          quantity: line.quantity,
          note: lineNoteEdit.note,
        },
        { onSuccess: () => setLineNoteEdit(null) },
      );
    },
    lineNotePending: updateItemMutation.isPending,
  };
}
