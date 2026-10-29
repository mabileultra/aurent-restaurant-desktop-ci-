package com.pos.service.identity.impl;

import com.pos.dto.identity.internal.CompanyDirectoryItem;
import com.pos.entity.Company;
import com.pos.exception.PosExceptions;
import com.pos.repository.CompanyRepository;
import com.pos.service.identity.IdentityCompanyDirectoryService;
import com.pos.service.identity.support.CompanyTypeCodes;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IdentityCompanyDirectoryServiceImpl implements IdentityCompanyDirectoryService {

    private static final int MAX_IDS = 1000;

    private final CompanyRepository companyRepository;

    @Override
    public List<Integer> findIds(String businessType, String regionCode, String districtCode) {
        String region = blankToNull(regionCode);
        String district = blankToNull(districtCode);
        List<String> typeCodes = CompanyTypeCodes.expand(businessType);
        if (typeCodes.isEmpty() && region == null && district == null) {
            return List.of();
        }
        if (typeCodes.isEmpty()) {
            return companyRepository.findIdsByGeo(region, district);
        }
        return companyRepository.findIdsByTypeAndGeo(typeCodes, region, district);
    }

    @Override
    public List<Integer> findIdsBySearch(String search) {
        if (!StringUtils.hasText(search)) {
            return List.of();
        }
        return companyRepository.findIdsByNameOrLogin(likePattern(search));
    }

    @Override
    public List<CompanyDirectoryItem> findByIds(Collection<Integer> ids) {
        List<Integer> limited = limit(ids);
        if (limited.isEmpty()) {
            return List.of();
        }
        return companyRepository.findAllById(limited).stream()
            .map(IdentityCompanyDirectoryServiceImpl::toItem)
            .toList();
    }

    private static CompanyDirectoryItem toItem(Company company) {
        return new CompanyDirectoryItem(
            company.getId(),
            company.getName(),
            company.getLoginCode(),
            company.getRegionCode(),
            company.getDistrictCode(),
            company.getBusinessType()
        );
    }

    private static List<Integer> limit(Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Integer> present = ids.stream().filter(id -> id != null).distinct().toList();
        if (present.size() > MAX_IDS) {
            throw PosExceptions.badRequest("Too many company ids");
        }
        return present;
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String likePattern(String raw) {
        return "%" + raw.trim().toLowerCase() + "%";
    }
}
