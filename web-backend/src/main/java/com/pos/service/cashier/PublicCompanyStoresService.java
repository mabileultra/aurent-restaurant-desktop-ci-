package com.pos.service.cashier;

import com.pos.dto.cashier.PublicCompanyStoresResponse;

public interface PublicCompanyStoresService {

    PublicCompanyStoresResponse listByLoginCode(String companyLoginCode);
}
