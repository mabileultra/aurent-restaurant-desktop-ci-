package com.pos.catalog.service;

import com.pos.catalog.entity.CatalogOutbox;
import com.pos.catalog.repository.CatalogOutboxRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogOutboxRetryService {

    private final CatalogOutboxRepository outboxRepository;

    @Transactional
    public int requeueFailed(int limit) {
        int size = Math.min(Math.max(limit, 1), 200);
        List<CatalogOutbox> failed = outboxRepository.findByStatusOrderByCreatedAtAsc(
            "FAILED",
            PageRequest.of(0, size)
        );
        for (CatalogOutbox row : failed) {
            row.setStatus("PENDING");
            row.setLastError(null);
            outboxRepository.save(row);
        }
        if (!failed.isEmpty()) {
            LogUtil.info(
                CatalogOutboxRetryService.class,
                "catalog outbox requeued FAILED→PENDING count={}",
                failed.size()
            );
        }
        return failed.size();
    }
}
