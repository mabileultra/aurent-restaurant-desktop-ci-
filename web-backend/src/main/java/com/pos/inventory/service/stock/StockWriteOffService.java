package com.pos.inventory.service.stock;

import com.pos.inventory.dto.stock.CreateWriteOffRequest;
import com.pos.inventory.dto.stock.WriteOffRowResponse;

public interface StockWriteOffService {

    WriteOffRowResponse create(CreateWriteOffRequest request);
}
