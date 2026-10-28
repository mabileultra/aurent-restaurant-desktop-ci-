import { lazy, Suspense, useState } from 'react';
import { useMenuAdminPage } from '../hooks/useMenuAdminPage';
import { useMenuDishExport } from '../hooks/useMenuDishExport';
import { useMenuPhotos } from '../../shared/hooks/useMenuPhotos';
import MenuCardMenu from '../components/MenuCardMenu';
import MenuPhotoSwitch from '../components/MenuPhotoSwitch';
import MenuDishFilters from '../components/MenuDishFilters';
import MenuDishForm from '../components/MenuDishForm';
import MenuDishList from '../components/MenuDishList';
import MenuVariantFormModal from '../components/MenuVariantFormModal';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/menu-admin.css';

const MenuDishImportModal = lazy(() => import('../components/MenuDishImportModal'));

export default function MenuAdminPage() {
  const p = useMenuAdminPage();
  const photos = useMenuPhotos(p.workspace.storeId, p.t);
  const [cardMenu, setCardMenu] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const dishExport = useMenuDishExport({
    t: p.t,
    items: p.items,
    stations: p.stations,
    menuCategories: p.menuCategories,
  });
  const listProps = {
    ...p,
    exportDishes: dishExport.exportList,
    exportBusy: dishExport.busy,
    openImport: () => setImportOpen(true),
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
        <MenuPhotoSwitch photos={photos} t={p.t} />
      </div>

      <MenuDishFilters p={p} />
      <MenuDishList
        p={listProps}
        photosEnabled={photos.enabled}
        onEditDish={(item) => p.startEdit(item)}
        onOpenMenu={(item, rect) => {
          setCardMenu((cur) => (cur?.item?.id === item.id ? null : { item, rect }));
        }}
      />
      <MenuDishForm p={p} photosEnabled={photos.enabled} />
      <MenuVariantFormModal p={p} />
      {importOpen ? (
        <Suspense fallback={null}>
          <MenuDishImportModal
            storeId={p.workspace.storeId}
            items={p.items}
            stations={p.stations}
            menuCategories={p.menuCategories}
            onClose={() => setImportOpen(false)}
          />
        </Suspense>
      ) : null}

      <MenuCardMenu
        menu={cardMenu}
        t={p.t}
        onClose={() => setCardMenu(null)}
        onEdit={(item) => {
          setCardMenu(null);
          p.startEdit(item);
        }}
        onAddVariant={(item) => {
          setCardMenu(null);
          p.openVariantForm(item);
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
