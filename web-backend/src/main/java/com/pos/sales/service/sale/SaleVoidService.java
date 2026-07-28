package com.pos.sales.service.sale;

import com.pos.sales.dto.sale.SaleResponse;

import java.util.UUID;

public interface SaleVoidService {

    SaleResponse voidSale(UUID id, String reason);
}
