import OpenTableModal from './OpenTableModal';
import OccupiedTableModal from './OccupiedTableModal';
import ReservedTableModal from './ReservedTableModal';
import TransferTableModal from './TransferTableModal';
import MergeTablesModal from './MergeTablesModal';
import AssignWaiterModal from './AssignWaiterModal';
import OpenCounterOrderModal from './OpenCounterOrderModal';
import ModifierPickModal from './ModifierPickModal';
import LineNoteModal from './LineNoteModal';
import RestaurantShiftModal from './shift/RestaurantShiftModal';
import RestaurantReceiptModal from './RestaurantReceiptModal';
import RestaurantPayModal from './RestaurantPayModal';
import { useNowTick } from './FloorTableCard';
import { resolveRestaurantPayTotal } from '../utils/restaurantPayAmount';
import { useAuthStore } from '../../../store/authStore';

/** All POS overlays — keeps floor/cashier pages under line budget. */
export default function FloorPosModals({ p, waiterMode = false }) {
  const a = p.tableActions;
  const now = useNowTick();
  const canPay = !waiterMode && p.access?.canPay;
  const user = useAuthStore((s) => s.user);
  const cashierName = user?.fullName || user?.username || '';

  return (
    <>
      <OpenTableModal
        open={!!p.openTable}
        table={p.openTable}
        form={p.guestForm}
        onChange={p.setGuestForm}
        onClose={() => p.setOpenTable(null)}
        onSubmit={() => p.openMutation.mutate()}
        isPending={p.openMutation.isPending}
        waiters={p.access?.canAssignWaiter ? p.waiters : []}
        t={p.t}
      />
      <ReservedTableModal
        open={!!p.reservedTable}
        table={p.reservedTable}
        onClose={() => p.setReservedTable(null)}
        onOpenOrder={() => p.beginOpenTable(p.reservedTable)}
        canOpenOrder={p.access?.canOpenOrder}
        t={p.t}
      />
      <OccupiedTableModal
        open={!!a.inspectTable}
        table={a.inspectTable}
        order={a.inspectOrder}
        orderLoading={a.inspectOrderLoading}
        waiterName={a.currentWaiterName}
        waiterNameById={p.waiterNameById}
        now={now}
        onClose={a.closeInspect}
        onContinue={a.continueOrder}
        onTransfer={a.openTransfer}
        onMerge={a.openMerge}
        onAssignWaiter={a.openAssign}
        onCancel={a.handleCancelOrder}
        canCancel={a.canCancelInspect}
        canTransferMerge={a.canTransferMerge}
        canAssignWaiter={a.canAssignWaiter}
        checks={a.checks}
        selectedOrderId={a.selectedOrderId}
        onSelectOrder={a.selectOrder}
        onNewCheck={() => {
          const table = a.inspectTable;
          const seed = (a.checks || []).find((row) => row.id === a.selectedOrderId)
            || a.checks?.[0]
            || table?.activeOrder;
          p.openExtraCheck(table, {
            guestCount: seed?.guestCount,
            waiterUserId: seed?.waiterUserId,
          });
        }}
        canOpenOrder={p.access?.canOpenOrder && !p.openExtraCheckPending}
        t={p.t}
      />
      {!waiterMode && a.canTransferMerge ? (
        <>
          <TransferTableModal
            open={a.transferOpen}
            sourceTable={a.inspectTable}
            tables={a.freeTables}
            selectedId={a.targetTableId}
            onSelect={a.setTargetTableId}
            onClose={a.closeTransfer}
            onConfirm={a.confirmTransfer}
            isPending={a.transferPending}
            t={p.t}
          />
          <MergeTablesModal
            open={a.mergeOpen}
            sourceTable={a.inspectTable}
            tables={a.mergeCandidateTables}
            selectedId={a.targetTableId}
            onSelect={a.setTargetTableId}
            onClose={a.closeMerge}
            onConfirm={a.confirmMerge}
            isPending={a.mergePending}
            t={p.t}
          />
        </>
      ) : null}
      <AssignWaiterModal
        open={a.assignOpen}
        currentWaiterId={a.inspectTable?.activeOrder?.waiterUserId}
        currentWaiterName={a.currentWaiterName}
        waiters={p.waiters}
        selectedId={a.assignWaiterId}
        onSelect={a.setAssignWaiterId}
        onClose={a.closeAssign}
        onConfirm={a.confirmAssign}
        isPending={a.assignPending}
        t={p.t}
      />
      {!waiterMode ? (
        <OpenCounterOrderModal
          open={p.counterModalOpen}
          channel={p.channel}
          form={p.counterForm}
          onChange={p.setCounterForm}
          onClose={() => p.setCounterModalOpen(false)}
          onSubmit={() => p.openCounterMutation.mutate()}
          isPending={p.openCounterMutation.isPending}
          t={p.t}
        />
      ) : null}
      <ModifierPickModal
        item={p.pendingMenuItem}
        variants={p.pendingVariants}
        onSelectVariant={p.selectComposeVariant}
        groups={p.modifierGroups}
        selectedIds={p.selectedModifierIds}
        onToggle={p.toggleModifier}
        note={p.pendingItemNote}
        onNoteChange={p.setPendingItemNote}
        onClose={p.closeModifiers}
        onConfirm={p.confirmModifiers}
        isPending={p.addItemMutation.isPending}
        t={p.t}
      />
      <LineNoteModal
        open={!!p.lineNoteEdit}
        line={p.lineNoteEdit}
        value={p.lineNoteEdit?.note ?? ''}
        onChange={(note) => p.setLineNoteEdit((prev) => (prev ? { ...prev, note } : prev))}
        onClose={() => p.setLineNoteEdit(null)}
        onSave={p.saveLineNote}
        isPending={p.lineNotePending}
        t={p.t}
      />
      <RestaurantShiftModal
        open={Boolean(p.shiftModal)}
        onClose={() => p.setShiftModal(null)}
        storeId={p.workspace?.storeId}
        storeName={p.workspace?.storeName}
        cashierName={cashierName}
        shift={p.shift}
        t={p.t}
      />
      {canPay && p.payModalOpen && p.order ? (
        <RestaurantPayModal
          open={p.payModalOpen}
          totalDue={resolveRestaurantPayTotal(p.order, p.servicePreview)}
          paying={p.payMutation.isPending}
          onClose={p.closePayModal}
          onConfirm={(payload) => p.payMutation.mutate(payload)}
          t={p.t}
        />
      ) : null}
      {canPay && p.paidReceipt?.sale ? (
        <RestaurantReceiptModal
          sale={p.paidReceipt.sale}
          autoPrint={Boolean(p.paidReceipt.autoPrint)}
          onClose={p.closePaidReceipt}
          onRefund={(orderId) => p.refundMutation.mutate(orderId)}
          refunding={p.refundMutation.isPending}
          allowRefund
          t={p.t}
        />
      ) : null}
    </>
  );
}
