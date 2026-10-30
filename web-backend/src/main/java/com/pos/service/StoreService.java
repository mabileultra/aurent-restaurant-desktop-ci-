package com.pos.service;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.store.CreateStoreRequest;
import com.pos.dto.store.StoreResponse;
import com.pos.dto.store.UpdateStoreRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StoreService {

    List<StoreResponse> listStores();

    List<StoreResponse> listStores(Integer companyId);

    PageResponse<StoreResponse> listManaged(
        String search,
        Integer companyId,
        String businessType,
        String regionCode,
        String districtCode,
        Pageable pageable
    );

    StoreResponse getById(Integer id);

    StoreResponse create(CreateStoreRequest request);

    StoreResponse update(Integer id, UpdateStoreRequest request);

    StoreResponse toggleActive(Integer id);

    void delete(Integer id);
}
