import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';

export default function SuppliersRowActionsCell({
  t,
  row,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  deleting,
}) {
  return (
    <td className="px-2 py-3 text-right whitespace-nowrap">
      <TableRowActionsMenu
        open={open}
        onOpenChange={onOpenChange}
        actions={[
          {
            label: t('common.edit'),
            onClick: () => onEdit(row),
          },
          {
            label: t('common.delete'),
            danger: true,
            disabled: deleting,
            onClick: () => onDelete(row),
          },
        ]}
      />
    </td>
  );
}
