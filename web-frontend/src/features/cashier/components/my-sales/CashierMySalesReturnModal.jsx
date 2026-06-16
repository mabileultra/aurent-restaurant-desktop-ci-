import { SalePartialReturnModal } from '../../../../components/sale-return';

export default function CashierMySalesReturnModal({
  returnSaleId,
  onClose,
  onSuccess,
}) {
  return (
    <SalePartialReturnModal
      terminal
      open={!!returnSaleId}
      saleId={returnSaleId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
