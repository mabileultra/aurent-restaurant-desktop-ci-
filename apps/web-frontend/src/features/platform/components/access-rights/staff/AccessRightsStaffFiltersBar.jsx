import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PlatformSelect from '../../PlatformSelect';
import { rolesForBusinessType } from '../../../utils/rolesByBusinessType';
import { resolveRoleLabel } from '../utils/accessRightsCatalogUtils';

export default function AccessRightsStaffFiltersBar({
  searchTerm = '',
  onSearchChange,
  businessTypes = [],
  selectedBT = 'ALL',
  onSelectBT,
  companies = [],
  selectedCompanyId = '',
  onSelectCompanyId,
  selectedRole = 'ALL',
  onSelectRole,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const businessTypeOptions = useMemo(() => {
    return [
      { value: 'ALL', label: isRu ? 'Тип бизнеса: все' : 'Faoliyat turi: barchasi' },
      ...businessTypes.map((bt) => ({
        value: bt.code,
        label: bt.name,
      })),
    ];
  }, [businessTypes, isRu]);

  const companyOptions = useMemo(() => {
    return [
      { value: '', label: isRu ? 'Компания: все' : 'Kompaniya: barchasi' },
      ...companies.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ];
  }, [companies, isRu]);

  const roleOptions = useMemo(() => {
    const list = [{ value: 'ALL', label: isRu ? 'Все роли' : 'Barcha rollar' }];
    const codes = rolesForBusinessType(selectedBT === 'ALL' ? 'UNIVERSAL' : selectedBT);
    codes.forEach((code) => {
      list.push({ value: code, label: resolveRoleLabel(code, isRu ? 'ru' : 'uz') });
    });
    return list;
  }, [selectedBT, isRu]);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            isRu
              ? 'Поиск по имени, логину или компании...'
              : 'Ism, login yoki kompaniya bo‘yicha qidiruv...'
          }
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <div className="w-full sm:w-44 shrink-0">
          <PlatformSelect
            options={businessTypeOptions}
            value={selectedBT}
            onChange={(e) => onSelectBT(e.target.value)}
            size="sm"
            ariaLabel={isRu ? 'Тип бизнеса' : 'Faoliyat turi'}
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <PlatformSelect
            options={companyOptions}
            value={selectedCompanyId}
            onChange={(e) => onSelectCompanyId(e.target.value)}
            size="sm"
            searchable
            ariaLabel={isRu ? 'Компания' : 'Kompaniya'}
          />
        </div>

        <div className="w-full sm:w-40 shrink-0">
          <PlatformSelect
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => onSelectRole(e.target.value)}
            size="sm"
            ariaLabel={isRu ? 'Роль' : 'Rol'}
          />
        </div>
      </div>
    </div>
  );
}
