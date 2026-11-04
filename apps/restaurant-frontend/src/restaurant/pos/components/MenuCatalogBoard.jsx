import { useMenuCatalog } from '../hooks/useMenuCatalog';
import MenuCatalogSearch from './MenuCatalogSearch';
import MenuCategoryPanel from './MenuCategoryPanel';
import MenuDishListPanel from './MenuDishListPanel';
import '../styles/menu-catalog-board.css';

/**
 * Desktop cashier/waiter order catalog: categories + dish list + search portal.
 * Mobile keeps MenuPicker via separate mobile workspaces.
 */
export default function MenuCatalogBoard({
  items,
  qtyByMenuId = {},
  onAdd,
  onComposeFamily,
  t,
  rankByPunch = true,
  billingNote = null,
}) {
  const catalog = useMenuCatalog({ items, t, rankByPunch });

  return (
    <>
      <MenuCatalogSearch catalog={catalog} t={t} />
      <div className="rst-order__categories">
        <MenuCategoryPanel catalog={catalog} t={t} />
      </div>
      <div className="rst-order__dishes">
        <MenuDishListPanel
          catalog={catalog}
          qtyByMenuId={qtyByMenuId}
          onAdd={onAdd}
          onComposeFamily={onComposeFamily}
          t={t}
        />
        {billingNote}
      </div>
    </>
  );
}
