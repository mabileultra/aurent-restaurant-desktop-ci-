package com.pos.sales.service.sale;

import com.pos.sales.dto.sale.PartialReturnRequest;
import com.pos.sales.dto.sale.SaleResponse;

import java.util.UUID;

public interface SalePartialReturnService {

    SaleResponse returnItems(UUID saleId, PartialReturnRequest request);
}
