import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import { requireOrderId, isUsableOrderId } from '../utils/requireOrderId';
import {
  optimisticAddItem,
  optimisticRemoveItem,
  optimisticUpdateQty,
} from '../utils/optimisticOrderPatch';
import { isWeightSoldMenuItem } from '../utils/menuWeightSale';

/** Add / update qty-note / remove line — optimistic + add queue. */
export function useFloorLineMutations({
  t, qc, activeOrderId, order,
  setPendingMenuItem, setPendingVariants, setSelectedModifierIds, setPendingItemNote,
  setPendingWeightItem,
  cache,
}) {
  const {
    invalidateFloor, setOrderData, orderKeyFor, patchOrder, errMsg,
  } = cache;

  /** Per dish(+mods+note): serialize double-taps; different dishes stay parallel. */
  const addItemQueuesRef = useRef(new Map());
  const enqueueAddItem = (key, run) => {
    const prev = addItemQueuesRef.current.get(key) || Promise.resolve();
    const queued = prev.then(run, run);
    addItemQueuesRef.current.set(key, queued.then(() => undefined, () => undefined));
    return queued;
  };

  const addItemMutation = useMutation({
    mutationFn: ({ menuItem, modifierOptionIds, note, quantity, orderId: orderIdOverride }) => {
      let oid;
      try {
        oid = requireOrderId(orderIdOverride, activeOrderId, order?.id);
      } catch {
        return Promise.reject(new Error('order_required'));
      }
      const mods = (modifierOptionIds ?? []).map(String).sort().join(',');
      const noteKey = note?.trim() || '';
      const qty = Number(quantity) > 0 ? Number(quantity) : 1;
      const key = isWeightSoldMenuItem(menuItem) && !mods
        ? `${oid}:${menuItem.id}:weight`
        : `${oid}:${menuItem.id}:${mods}:${noteKey}:${qty}`;
      return enqueueAddItem(key, async () => {
        const body = {
          menuItemId: menuItem.id,
          quantity: qty,
          modifierOptionIds: modifierOptionIds ?? [],
          note: noteKey || undefined,
        };
        const res = await rstOrderApi.addItem(oid, body);
        return res?.data !== undefined ? res.data : res;
      });
    },
    onMutate: async ({ menuItem, modifierOptionIds, note, quantity, orderId: orderIdOverride }) => {
      const oid = isUsableOrderId(orderIdOverride)
        ? orderIdOverride
        : (isUsableOrderId(activeOrderId) ? activeOrderId : order?.id);
      if (!isUsableOrderId(oid)) return undefined;
      const key = orderKeyFor(oid);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      patchOrder(
        (current) => optimisticAddItem(current, menuItem, { modifierOptionIds, note, quantity }),
        oid,
      );
      return { wasBilling: prev?.status === 'BILLING', orderId: oid };
    },
    onSuccess: (res, _vars, ctx) => {
      setOrderData(res, ctx?.orderId);
      setPendingMenuItem(null);
      setPendingVariants?.(null);
      setSelectedModifierIds([]);
      setPendingItemNote?.('');
      setPendingWeightItem?.(null);
      window.setTimeout(() => invalidateFloor(), 0);
    },
    onError: (err, vars) => {
      qc.invalidateQueries({ queryKey: orderKeyFor(vars?.orderId) });
      const msg = String(err?.message || '');
      if (msg === 'order_required' || msg === 'order required') {
        toast.error(t('rst.order.orderRequired', {
          defaultValue: 'Сначала откройте стол и добавьте блюдо',
        }));
        return;
      }
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  const updateItemMutation = useMutation({
    mutationKey: ['rst-order-line', activeOrderId],
    mutationFn: async ({ itemId, quantity, note }) => {
      if (String(itemId).startsWith('tmp-')) {
        return Promise.resolve({ data: qc.getQueryData(orderKeyFor(activeOrderId)) });
      }
      const body = {};
      if (quantity != null) body.quantity = quantity;
      if (note !== undefined) body.note = note;
      return rstOrderApi.updateItem(activeOrderId, itemId, body);
    },
    onMutate: async ({ itemId, quantity }) => {
      if (quantity == null) return undefined;
      const key = orderKeyFor(activeOrderId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      patchOrder((current) => optimisticUpdateQty(current, itemId, quantity));
      return { prev, key };
    },
    onSuccess: (res) => {
      if (res?.data) setOrderData(res);
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled-items'] });
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
      else qc.invalidateQueries({ queryKey: orderKeyFor(activeOrderId) });
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  const removeItemMutation = useMutation({
    mutationKey: ['rst-order-line', activeOrderId],
    mutationFn: async (itemId) => {
      if (String(itemId).startsWith('tmp-')) {
        return Promise.resolve({ data: qc.getQueryData(orderKeyFor(activeOrderId)) });
      }
      return rstOrderApi.removeItem(activeOrderId, itemId);
    },
    onMutate: async (itemId) => {
      const key = orderKeyFor(activeOrderId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      patchOrder((current) => optimisticRemoveItem(current, itemId));
      return { prev, key };
    },
    onSuccess: (res) => {
      if (res?.data) setOrderData(res);
      qc.invalidateQueries({ queryKey: ['rst-recent-cancelled-items'] });
    },
    onError: (err, _itemId, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
      else qc.invalidateQueries({ queryKey: orderKeyFor(activeOrderId) });
      errMsg(err, 'rst.order.saveFailed');
    },
  });

  return { addItemMutation, updateItemMutation, removeItemMutation };
}
