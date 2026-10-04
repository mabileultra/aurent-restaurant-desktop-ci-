package com.pos.sales.service;

import com.pos.sales.dto.cashregister.CashRegisterDetailResponse;
import com.pos.sales.dto.cashregister.CashRegisterRowResponse;
import com.pos.sales.dto.cashregister.UpsertCashRegisterRequest;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CashRegisterService {

    PageResponse<CashRegisterRowResponse> list(
        Integer storeId,
        String storeSearch,
        String equipmentModel,
        String equipmentSerial,
        String fiscalCardId,
        Pageable pageable
    );

    List<String> listDistinctEquipmentSerials();

    CashRegisterRowResponse toggleStatus(Long id);

    CashRegisterDetailResponse getById(Long id);

    CashRegisterRowResponse create(UpsertCashRegisterRequest request);

    CashRegisterRowResponse update(Long id, UpsertCashRegisterRequest request);
}
