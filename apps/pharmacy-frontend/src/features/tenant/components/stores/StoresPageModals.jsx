import React from 'react';
import StoreFormModal from './StoreFormModal';
import PharmacyIntegrationSettingsModal from './PharmacyIntegrationSettingsModal';
import PlatformStoreQuickDrawer from './PlatformStoreQuickDrawer';
import PlatformStoreDeleteModal from './PlatformStoreDeleteModal';
import PlatformStoreToggleActiveModal from './PlatformStoreToggleActiveModal';

export default function StoresPageModals({ p }) {
  return (
    <>
      <StoreFormModal
        open={p.modalOpen}
        onClose={p.closeModal}
        onSubmit={(payload) => p.saveMutation.mutate(payload)}
        isPending={p.saveMutation.isPending}
        initial={p.editing}
        showCompanySelect={p.showCompanySelect}
        companies={p.companies}
        existingStores={p.allStores}
      />

      <PharmacyIntegrationSettingsModal
        open={Boolean(p.pharmacyIntegrationStore)}
        store={p.pharmacyIntegrationStore}
        onClose={p.closePharmacyIntegration}
      />

      <PlatformStoreQuickDrawer
        open={Boolean(p.selectedStore)}
        store={p.selectedStore}
        onClose={p.closeQuickDrawer}
        onEdit={p.openEdit}
        onToggleActive={p.tryToggleActive}
        onPharmacyIntegration={p.openPharmacyIntegration}
        t={p.t}
      />

      <PlatformStoreDeleteModal
        open={Boolean(p.storeToDelete)}
        store={p.storeToDelete}
        onClose={() => p.setStoreToDelete(null)}
        onConfirmDelete={p.handleConfirmDelete}
        onToggleActive={(s) => {
          p.setStoreToDelete(null);
          p.tryToggleActive(s);
        }}
        isDeleting={p.isDeleting}
        t={p.t}
      />

      <PlatformStoreToggleActiveModal
        open={Boolean(p.storeToToggleActive)}
        store={p.storeToToggleActive}
        onClose={() => p.setStoreToToggleActive(null)}
        onConfirm={p.handleConfirmToggleActive}
        isToggling={p.isTogglingActive}
        t={p.t}
      />
    </>
  );
}
