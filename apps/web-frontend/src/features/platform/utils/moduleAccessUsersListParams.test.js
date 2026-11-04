import { describe, expect, it } from 'vitest';
import { buildModuleAccessUsersListParams } from './moduleAccessUsersListParams';

describe('buildModuleAccessUsersListParams', () => {
  it('drops businessType from API when a company is selected', () => {
    const withCompany = buildModuleAccessUsersListParams({
      companyId: '42',
      businessType: 'RESTAURANT',
      search: '',
      userFilter: 'all',
    });
    expect(withCompany.companyId).toBe(42);
    expect(withCompany.businessType).toBeUndefined();

    const afterUiTypeChange = buildModuleAccessUsersListParams({
      companyId: '42',
      businessType: 'CANTEEN',
      search: '',
      userFilter: 'all',
    });
    expect(afterUiTypeChange).toEqual(withCompany);
  });

  it('sends businessType only for all-companies view', () => {
    const params = buildModuleAccessUsersListParams({
      companyId: '',
      businessType: 'RESTAURANT',
      search: '77004',
      userFilter: 'unconfigured',
    });
    expect(params.businessType).toBe('RESTAURANT');
    expect(params.search).toBe('77004');
    expect(params.accessFilter).toBe('unconfigured');
  });
});
