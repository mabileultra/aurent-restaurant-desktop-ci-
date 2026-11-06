import { useNavigate } from 'react-router-dom';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';

export default function StockReceiptsActionsCell({
  t,
  editTo,
  open,
  onOpenChange,
  deleting,
  onDelete,
}) {
  const navigate = useNavigate();

  return (
    <td className="px-2 py-2 text-right whitespace-nowrap">
      <TableRowActionsMenu
        open={open}
        onOpenChange={onOpenChange}
        actions={[
          {
            label: t('stockReports.receiptEdit'),
            onClick: () => navigate(editTo),
          },
          {
            label: t('stockReports.receiptDelete'),
            danger: true,
            disabled: deleting,
            onClick: onDelete,
          },
        ]}
      />
    </td>
  );
}
