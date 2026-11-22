package com.pos.service.cashier.impl;

import com.pos.dto.cashier.PublicCompanyStoresResponse;
import com.pos.service.cashier.PublicCompanyStoresService;
import com.pos.service.cashier.support.PublicCompanyStoresLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicCompanyStoresServiceImpl implements PublicCompanyStoresService {

    private final PublicCompanyStoresLookup lookup;

    @Override
    @Transactional(readOnly = true)
    public PublicCompanyStoresResponse listByLoginCode(String companyLoginCode) {
        return lookup.listByLoginCode(companyLoginCode);
    }
}
