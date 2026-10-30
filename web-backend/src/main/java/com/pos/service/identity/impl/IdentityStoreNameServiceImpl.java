package com.pos.service.identity.impl;

import com.pos.dto.identity.internal.StoreNameItem;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.repository.StoreRepository;
import com.pos.service.identity.IdentityStoreNameService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IdentityStoreNameServiceImpl implements IdentityStoreNameService {

    private static final int MAX_IDS = 1000;

    private final StoreRepository storeRepository;

    @Override
    public List<Integer> findIdsBySearch(String search) {
        if (!StringUtils.hasText(search)) {
            return List.of();
        }
        return storeRepository.findIdsByNameLike("%" + search.trim().toLowerCase() + "%");
    }

    @Override
    public List<StoreNameItem> findByIds(Collection<Integer> ids) {
        List<Integer> limited = limit(ids);
        if (limited.isEmpty()) {
            return List.of();
        }
        return storeRepository.findAllById(limited).stream()
            .map(IdentityStoreNameServiceImpl::toItem)
            .toList();
    }

    private static StoreNameItem toItem(Store store) {
        return new StoreNameItem(store.getId(), store.getName());
    }

    private static List<Integer> limit(Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Integer> present = ids.stream().filter(id -> id != null).distinct().toList();
        if (present.size() > MAX_IDS) {
            throw PosExceptions.badRequest("Too many store ids");
        }
        return present;
    }
}
