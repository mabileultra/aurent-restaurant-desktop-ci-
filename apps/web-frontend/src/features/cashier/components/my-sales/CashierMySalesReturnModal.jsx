import { SalePartialReturnModal } from '../../../../components/sale-return';

export default function CashierMySalesReturnModal({
  returnSaleId,
  catalogKind,
  onClose,
  onSuccess,
}) {
  return (
    <SalePartialReturnModal
      terminal
      catalogKind={catalogKind}
      open={!!returnSaleId}
      saleId={returnSaleId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
