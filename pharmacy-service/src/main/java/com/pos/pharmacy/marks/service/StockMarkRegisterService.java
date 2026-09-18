package com.pos.pharmacy.marks.service;

import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;

public interface StockMarkRegisterService {

    StockMarkRegisterResponse registerInStock(StockMarkRegisterRequest request);
}
