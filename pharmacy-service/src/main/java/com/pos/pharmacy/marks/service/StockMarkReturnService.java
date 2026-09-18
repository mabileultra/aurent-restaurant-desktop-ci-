package com.pos.pharmacy.marks.service;

import java.util.Collection;
import java.util.UUID;

public interface StockMarkReturnService {

    int restoreOnReturn(Integer storeId, UUID saleId, Collection<String> markCodes);
}
