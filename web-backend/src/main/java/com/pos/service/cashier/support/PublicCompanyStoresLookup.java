package com.pos.service.cashier.support;

import com.pos.dto.cashier.PublicCompanyStoreItem;
import com.pos.dto.cashier.PublicCompanyStoresResponse;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.repository.CompanyRepository;
import com.pos.repository.StoreRepository;
import com.pos.util.CompanyLoginCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PublicCompanyStoresLookup {

    private final CompanyRepository companyRepository;
    private final StoreRepository storeRepository;

    public PublicCompanyStoresResponse listByLoginCode(String rawCode) {
        String code = CompanyLoginCodeUtil.normalize(rawCode);
        if (!StringUtils.hasText(code) || !CompanyLoginCodeUtil.isValid(code)) {
            throw CompanyLoginCodeUtil.invalidFormat();
        }
        Company company = companyRepository.findByLoginCodeIgnoreCase(code)
            .orElseThrow(() -> new BadRequestException("Company not found"));
        if (!company.isActive()) {
            throw new BadRequestException("Company is inactive");
        }
        List<PublicCompanyStoreItem> stores = storeRepository
            .findByCompanyIdAndActiveTrueOrderByNameAsc(company.getId())
            .stream()
            .map(this::toItem)
            .toList();
        return new PublicCompanyStoresResponse(
            company.getId(),
            company.getName(),
            company.getLoginCode(),
            stores
        );
    }

    private PublicCompanyStoreItem toItem(Store store) {
        return new PublicCompanyStoreItem(store.getId(), store.getName());
    }
}
