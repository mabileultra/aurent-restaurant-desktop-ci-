import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMenuAdminPage } from '../hooks/useMenuAdminPage';
import MenuCardMenu from '../components/MenuCardMenu';
import MenuDishFilters from '../components/MenuDishFilters';
import MenuDishForm from '../components/MenuDishForm';
import MenuDishList from '../components/MenuDishList';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/menu-admin.css';

export default function MenuAdminPage() {
  const p = useMenuAdminPage();
  const [cardMenu, setCardMenu] = useState(null);

  const showList = () => {
    p.closeComposer();
    setCardMenu(null);
  };

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-menu">
      <div className="rst-menu__head">
        <div className="rst-menu__intro">
          <h1 className="rst-coming__title">{p.t('rst.admin.menuTitle')}</h1>
          <p className="rst-coming__text">{p.t('rst.admin.menuSubtitle')}</p>
        </div>
        <div className="rst-menu__switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!p.composerOpen}
            className={`rst-menu__switch-btn${!p.composerOpen ? ' is-active' : ''}`}
            onClick={showList}
          >
            {p.t('rst.admin.menuList')}
          </button>
          <Link className="rst-menu__switch-btn" role="tab" to="/rst/admin/recipes">
            {p.t('rst.admin.toRecipes')}
          </Link>
        </div>
      </div>

      <MenuDishFilters p={p} />
      <MenuDishForm p={p} />
      <MenuDishList
        p={p}
        onOpenMenu={(item, rect) => {
          setCardMenu((cur) => (cur?.item?.id === item.id ? null : { item, rect }));
        }}
      />

      <MenuCardMenu
        menu={cardMenu}
        t={p.t}
        onClose={() => setCardMenu(null)}
        onEdit={(item) => {
          setCardMenu(null);
          p.startEdit(item);
        }}
        onDelete={(item) => {
          setCardMenu(null);
          if (window.confirm(p.t('rst.admin.confirmDeactivateDish'))) {
            p.deactivateMutation.mutate(item.id);
          }
        }}
      />
    </section>
  );
}
