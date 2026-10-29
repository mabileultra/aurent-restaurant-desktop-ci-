package com.pos.service.identity;

import com.pos.dto.identity.internal.StoreNameItem;

import java.util.Collection;
import java.util.List;

public interface IdentityStoreNameService {

    List<Integer> findIdsBySearch(String search);

    List<StoreNameItem> findByIds(Collection<Integer> ids);
}
