package com.pos.sales.service.sale;

import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.dto.sale.SaleResponse;

public interface SaleCheckoutService {

    SaleResponse processSale(CreateSaleRequest req, java.util.UUID cashierId);
}
