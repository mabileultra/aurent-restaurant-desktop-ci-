package com.pos.service.identity;

import com.pos.dto.identity.internal.CompanyDirectoryItem;

import java.util.Collection;
import java.util.List;

public interface IdentityCompanyDirectoryService {

    List<Integer> findIds(String businessType, String regionCode, String districtCode);

    List<Integer> findIdsBySearch(String search);

    List<CompanyDirectoryItem> findByIds(Collection<Integer> ids);
}
