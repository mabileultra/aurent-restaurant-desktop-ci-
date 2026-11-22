package com.pos.dto.cashier;

import java.util.List;

public record PublicCompanyStoresResponse(
    Integer companyId,
    String companyName,
    String companyLoginCode,
    List<PublicCompanyStoreItem> stores
) {}
