import RstRowMenu from '../../shared/components/RstRowMenu';

export default function MenuCardMenu({ menu, onClose, onEdit, onAddVariant, onDelete, t }) {
  if (!menu) return null;

  return (
    <RstRowMenu
      rect={menu.rect}
      t={t}
      onClose={onClose}
      items={[
        {
          key: 'edit',
          label: t('common.edit'),
          onClick: () => onEdit(menu.item),
        },
        {
          key: 'variant',
          label: t('rst.admin.addVariant'),
          onClick: () => onAddVariant(menu.item),
        },
        {
          key: 'recipe',
          label: t('rst.admin.toRecipe'),
          to: `/rst/admin/recipes?dish=${menu.item.id}`,
        },
        {
          key: 'delete',
          label: t('common.delete'),
          danger: true,
          onClick: () => onDelete(menu.item),
        },
      ]}
    />
  );
}
