import { Plus } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformBusinessFieldFormModal from '../components/business-types/PlatformBusinessFieldFormModal';
import PlatformBusinessTypeDetail from '../components/business-types/PlatformBusinessTypeDetail';
import PlatformBusinessTypeFormModal from '../components/business-types/PlatformBusinessTypeFormModal';
import PlatformBusinessTypesList from '../components/business-types/PlatformBusinessTypesList';
import { usePlatformBusinessTypesPage } from '../hooks/usePlatformBusinessTypesPage';

export default function PlatformBusinessTypesPage() {
  const p = usePlatformBusinessTypesPage();

  return (
    <PageLayout
      title={p.t('platform.businessTypes.title')}
      subtitle={p.t('platform.businessTypes.subtitle')}
      actions={(
        <BaseButton onClick={p.openCreateType}>
          <Plus size={16} />
          {p.t('platform.businessTypes.addType')}
        </BaseButton>
      )}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
        <PlatformBusinessTypesList
          t={p.t}
          types={p.types}
          isLoading={p.isLoading}
          activeTypeId={p.activeTypeId}
          onSelect={p.setSelectedId}
        />
        <PlatformBusinessTypeDetail
          t={p.t}
          detail={p.detail}
          detailLoading={p.detailLoading}
          fields={p.fields}
          catalogUnits={p.catalogUnits}
          unitCodes={p.unitCodes}
          defaultUnitCode={p.defaultUnitCode}
          rules={p.rules}
          priceRules={p.priceRules}
          displayRules={p.displayRules}
          onEditType={p.openEditType}
          onDeleteType={p.tryDeleteType}
          onAddField={p.openCreateField}
          onEditField={p.openFieldEdit}
          onDeleteField={p.tryDeleteField}
          onToggleUnit={p.toggleUnit}
          onSetDefaultUnit={p.setDefaultUnit}
          onToggleRule={p.toggleRule}
          onPriceRuleChange={p.changePriceRule}
          onAddDisplayRule={p.addDisplayRule}
          onDisplayRuleChange={p.changeDisplayRule}
          onRemoveDisplayRule={p.removeDisplayRule}
          onSaveUnits={() => p.saveUnitsMutation.mutate()}
          onSaveRules={() => p.saveRulesMutation.mutate()}
          onSavePriceRules={() => p.savePriceRulesMutation.mutate()}
          onSaveDisplayRules={() => p.saveDisplayRulesMutation.mutate()}
          savingUnits={p.saveUnitsMutation.isPending}
          savingRules={p.saveRulesMutation.isPending}
          savingPriceRules={p.savePriceRulesMutation.isPending}
          savingDisplayRules={p.saveDisplayRulesMutation.isPending}
        />
      </div>

      <PlatformBusinessTypeFormModal
        t={p.t}
        modal={p.typeModal}
        onClose={p.closeTypeModal}
        onFieldChange={p.updateTypeForm}
        onSave={p.saveType}
        saving={p.saveTypeMutation.isPending}
      />

      <PlatformBusinessFieldFormModal
        t={p.t}
        modal={p.fieldModal}
        form={p.fieldForm}
        referenceBooks={p.referenceBooks}
        onClose={p.closeFieldModal}
        onFieldChange={p.updateFieldForm}
        onSave={p.submitField}
        saving={p.saveFieldMutation.isPending}
      />
    </PageLayout>
  );
}
