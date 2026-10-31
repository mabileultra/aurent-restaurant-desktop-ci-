package com.pos.restaurant.store.service;

import com.pos.restaurant.store.dto.InternalStoreUpsertRequest;

public interface CloudStoreMirrorService {

    void upsert(InternalStoreUpsertRequest request);

    void deactivate(Integer storeId);
}
