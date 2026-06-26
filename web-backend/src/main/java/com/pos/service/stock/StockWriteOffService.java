package com.pos.service.stock;

import com.pos.dto.stock.CreateWriteOffRequest;
import com.pos.dto.stock.WriteOffRowResponse;

public interface StockWriteOffService {

    WriteOffRowResponse create(CreateWriteOffRequest request);
}
